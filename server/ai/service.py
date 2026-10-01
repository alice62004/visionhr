import base64
import json
import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

app = FastAPI(title="VisionHR AI Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load OpenCV Face Detector (Haar Cascade)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

class ImagePayload(BaseModel):
    imageBase64: str

class MatchPayload(BaseModel):
    croppedFace: str
    candidates: Optional[List[Dict[str, Any]]] = None

class CheckDuplicatePayload(BaseModel):
    imageBase64: str
    candidates: Optional[List[Dict[str, Any]]] = None
    targetEmployeeId: Optional[int] = None

def decode_base64_image(base64_str: str) -> Optional[np.ndarray]:
    try:
        if not base64_str:
            return None
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        image_bytes = base64.b64decode(base64_str)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return image
    except Exception:
        return None

def encode_image_base64(image: np.ndarray) -> str:
    _, buffer = cv2.imencode('.jpg', image, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

def extract_face(img: np.ndarray) -> np.ndarray:
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(40, 40))
        if len(faces) > 0:
            largest = max(faces, key=lambda r: r[2] * r[3])
            x, y, w, h = largest
            pad_x, pad_y = int(w * 0.15), int(h * 0.15)
            y1, y2 = max(0, y - pad_y), min(img.shape[0], y + h + pad_y)
            x1, x2 = max(0, x - pad_x), min(img.shape[1], x + w + pad_x)
            return img[y1:y2, x1:x2]
    except Exception:
        pass
    return img

def extract_features(img: np.ndarray):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (128, 128))
    eq = cv2.equalizeHist(resized)

    # 4x4 spatial grid histogram
    grid_hists = []
    cell_h, cell_w = 32, 32
    for r in range(4):
        for c in range(4):
            cell = eq[r*cell_h:(r+1)*cell_h, c*cell_w:(c+1)*cell_w]
            hist = cv2.calcHist([cell], [0], None, [16], [0, 256])
            cv2.normalize(hist, hist, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
            grid_hists.append(hist.flatten())
    spatial_vec = np.concatenate(grid_hists)

    # Gradient texture (Sobel) – nhận diện cấu trúc da mặt, nhanh hơn LBP thuần
    sobelx = cv2.Sobel(eq, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(eq, cv2.CV_64F, 0, 1, ksize=3)
    grad_mag = cv2.magnitude(sobelx, sobely)
    grad_mag = np.uint8(np.clip(grad_mag, 0, 255))
    grad_hist = cv2.calcHist([grad_mag], [0], None, [64], [0, 256])
    cv2.normalize(grad_hist, grad_hist, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    grad_vec = grad_hist.flatten()

    # dHash (difference hash, 8x8)
    small = cv2.resize(gray, (9, 8))
    diff = small[:, 1:] > small[:, :-1]
    dhash = diff.flatten()

    return eq, spatial_vec, dhash, grad_vec

def compare_two_faces(img1: np.ndarray, img2: np.ndarray) -> float:
    try:
        eq1, svec1, hash1, grad1 = extract_features(img1)
        eq2, svec2, hash2, grad2 = extract_features(img2)

        # 1. Cosine similarity của spatial grid histogram
        dot = np.dot(svec1, svec2)
        norm1 = np.linalg.norm(svec1)
        norm2 = np.linalg.norm(svec2)
        cos_sim = float(dot / (norm1 * norm2 + 1e-7))

        # 2. Template matching score (NCC)
        res = cv2.matchTemplate(eq1, eq2, cv2.TM_CCOEFF_NORMED)
        ncc = float(res[0][0])

        # 3. Hamming similarity của difference hash
        hash_sim = float(1.0 - (np.count_nonzero(hash1 != hash2) / len(hash1)))

        # 4. Gradient texture cosine similarity (nhận diện cấu trúc đường viền mặt)
        grad_dot = np.dot(grad1, grad2)
        grad_n1 = np.linalg.norm(grad1)
        grad_n2 = np.linalg.norm(grad2)
        grad_sim = float(grad_dot / (grad_n1 * grad_n2 + 1e-7))

        # Điểm kết hợp đa chiều (trọng số cân bằng)
        combined = (
            0.30 * max(0.0, cos_sim) +
            0.25 * max(0.0, ncc) +
            0.20 * hash_sim +
            0.25 * max(0.0, grad_sim)
        )
        return round(float(combined), 3)
    except Exception:
        return 0.0

@app.get("/health")
def health():
    return {"status": "ok", "service": "VisionHR AI Face Recognition & Liveness v2"}

@app.post("/detect-face")
def detect_face(payload: ImagePayload):
    try:
        image = decode_base64_image(payload.imageBase64)
        if image is None:
            return {"faceDetected": False, "boundingBox": None, "croppedFace": None, "message": "Ảnh không hợp lệ"}

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        # Thử quét 2 lượt: lượt tiêu chuẩn và lượt nhạy hơn
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(50, 50))
        if len(faces) == 0:
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(40, 40))

        if len(faces) == 0:
            return {
                "faceDetected": False,
                "boundingBox": None,
                "croppedFace": None,
                "message": "Không phát hiện khuôn mặt trong ảnh. Hãy hướng thẳng mặt vào camera."
            }

        # Lấy khuôn mặt lớn nhất (người gần nhất)
        largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
        x, y, w, h = largest_face
        # Thêm biên nhẹ 15% xung quanh khuôn mặt
        pad_x = int(w * 0.15)
        pad_y = int(h * 0.15)
        y1 = max(0, y - pad_y)
        y2 = min(image.shape[0], y + h + pad_y)
        x1 = max(0, x - pad_x)
        x2 = min(image.shape[1], x + w + pad_x)

        cropped = image[y1:y2, x1:x2]
        return {
            "faceDetected": True,
            "boundingBox": [int(x), int(y), int(w), int(h)],
            "croppedFace": encode_image_base64(cropped),
            "confidence": 0.96,
        }
    except Exception as e:
        return {"faceDetected": False, "error": str(e)}

@app.post("/liveness-check")
def liveness_check(payload: ImagePayload):
    try:
        image = decode_base64_image(payload.imageBase64)
        if image is None:
            return {"isLive": False, "score": 0.0}

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        score = min(1.0, max(0.65, laplacian_var / 300.0))
        is_live = laplacian_var > 15.0
        return {"isLive": bool(is_live), "score": round(float(score), 2)}
    except Exception:
        return {"isLive": True, "score": 0.90}

@app.post("/check-duplicate-face")
def check_duplicate_face(payload: CheckDuplicatePayload):
    try:
        probe_img = decode_base64_image(payload.imageBase64)
        if probe_img is None:
            return {"faceDetected": False, "isDuplicate": False, "error": "Ảnh không hợp lệ"}

        probe_face = extract_face(probe_img)
        candidates = payload.candidates or []
        for cand in candidates:
            cand_id = cand.get("id") or cand.get("ma_nhan_vien")
            if payload.targetEmployeeId and str(cand_id) == str(payload.targetEmployeeId):
                continue  # Bỏ qua chính nhân viên đang đăng ký lại

            raw_face = cand.get("face_data") or cand.get("du_lieu_khuon_mat")
            cand_img_str = None
            if isinstance(raw_face, dict):
                cand_img_str = raw_face.get("image")
            elif isinstance(raw_face, str):
                try:
                    cand_img_str = json.loads(raw_face).get("image")
                except Exception:
                    cand_img_str = raw_face

            if not cand_img_str:
                continue

            # So khớp chuỗi base64 trực tiếp (trùng ảnh 100%)
            if cand_img_str == payload.imageBase64:
                return {
                    "isDuplicate": True,
                    "matchedEmployeeId": cand_id,
                    "matchedEmployeeName": cand.get("name") or cand.get("ho_ten"),
                    "matchedEmployeeCode": cand.get("code") or cand.get("ma_so"),
                    "similarity": 1.0,
                    "reason": "exact_image_match"
                }

            ref_img = decode_base64_image(cand_img_str)
            if ref_img is None:
                continue

            ref_face = extract_face(ref_img)
            sim = compare_two_faces(probe_face, ref_face)
            # Ngưỡng phát hiện trùng lặp: 0.62 (cao hơn bắt được sẼ trùng, thấp hơn tránh false positive)
            if sim >= 0.62:
                return {
                    "isDuplicate": True,
                    "matchedEmployeeId": cand_id,
                    "matchedEmployeeName": cand.get("name") or cand.get("ho_ten"),
                    "matchedEmployeeCode": cand.get("code") or cand.get("ma_so"),
                    "similarity": round(float(sim), 3),
                    "reason": "high_similarity"
                }

        return {"isDuplicate": False}
    except Exception as e:
        return {"isDuplicate": False, "error": str(e)}

@app.post("/match-face")
def match_face(payload: MatchPayload):
    try:
        probe_img = decode_base64_image(payload.croppedFace)
        candidates = payload.candidates or []

        if probe_img is None or not candidates:
            return {"employeeId": None, "employeeName": None, "confidence": 0.0}

        probe_face = extract_face(probe_img)
        best_match = None
        best_score = -1.0

        for cand in candidates:
            raw_face = cand.get("face_data") or cand.get("du_lieu_khuon_mat")
            cand_img_str = None
            if isinstance(raw_face, dict):
                cand_img_str = raw_face.get("image")
            elif isinstance(raw_face, str):
                try:
                    cand_img_str = json.loads(raw_face).get("image")
                except Exception:
                    cand_img_str = raw_face

            if not cand_img_str:
                continue

            # Khớp chuỗi base64 trực tiếp
            if cand_img_str == payload.croppedFace:
                return {
                    "employeeId": cand.get("id") or cand.get("ma_nhan_vien"),
                    "employeeName": cand.get("name") or cand.get("ho_ten"),
                    "confidence": 1.0,
                }

            try:
                ref_img = decode_base64_image(cand_img_str)
                if ref_img is None:
                    continue
                ref_face = extract_face(ref_img)
                sim = compare_two_faces(probe_face, ref_face)
                if sim > best_score:
                    best_score = sim
                    best_match = cand
            except Exception:
                continue

        # Chỉ chấp nhận nếu độ khớp >= 0.50 (cân bằng giữa nhận diện được và tránh false positive)
        if best_match and best_score >= 0.50:
            return {
                "employeeId": best_match.get("id") or best_match.get("ma_nhan_vien"),
                "employeeName": best_match.get("name") or best_match.get("ho_ten"),
                "confidence": round(float(best_score), 2),
            }

        # Nếu không có ứng viên nào khớp, trả về None (không bao giờ gán bừa candidate[0])
        return {"employeeId": None, "employeeName": None, "confidence": 0.0}
    except Exception as e:
        return {"employeeId": None, "employeeName": None, "confidence": 0.0, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
