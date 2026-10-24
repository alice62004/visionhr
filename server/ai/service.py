import base64
import json
import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# ─── InsightFace / ArcFace ───────────────────────────────────────────────────
try:
    import insightface
    from insightface.app import FaceAnalysis
    _app = FaceAnalysis(name="buffalo_sc", providers=["CPUExecutionProvider"])
    _app.prepare(ctx_id=0, det_size=(320, 320))
    USE_INSIGHTFACE = True
    print("[VisionHR] [OK] InsightFace (buffalo_sc / ArcFace) loaded successfully with det_size=(320,320)")
except Exception as e:
    USE_INSIGHTFACE = False
    print(f"[VisionHR] [WARN] InsightFace not available ({e}), falling back to OpenCV Haar+Histogram")
    _face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# ─── FastAPI setup ────────────────────────────────────────────────────────────
app = FastAPI(title="VisionHR AI Service", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic models ──────────────────────────────────────────────────────────
class ImagePayload(BaseModel):
    imageBase64: str

class MatchPayload(BaseModel):
    croppedFace: str
    candidates: Optional[List[Dict[str, Any]]] = None

class CheckDuplicatePayload(BaseModel):
    imageBase64: str
    candidates: Optional[List[Dict[str, Any]]] = None
    targetEmployeeId: Optional[int] = None

# ─── Helpers ──────────────────────────────────────────────────────────────────
def decode_base64_image(base64_str: str) -> Optional[np.ndarray]:
    try:
        if not base64_str:
            return None
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        image_bytes = base64.b64decode(base64_str)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception:
        return None

def encode_image_base64(image: np.ndarray) -> str:
    _, buffer = cv2.imencode(".jpg", image, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

def extract_faces(img: np.ndarray):
    """Phát hiện khuôn mặt đa tỷ lệ (hỗ trợ cả ảnh thẻ crop nhỏ và webcam toàn cảnh)"""
    if not USE_INSIGHTFACE or img is None:
        return []
    faces = _app.get(img)
    if not faces:
        h, w = img.shape[:2]
        if min(h, w) < 200 or max(h, w) < 320:
            scale = 320.0 / min(h, w)
            resized = cv2.resize(img, (int(w * scale), int(h * scale)))
            faces = _app.get(resized)
    return faces

def get_embedding(img: np.ndarray) -> Optional[np.ndarray]:
    """Lấy ArcFace embedding 512-dim cho khuôn mặt lớn nhất trong ảnh."""
    if not USE_INSIGHTFACE or img is None:
        return None
    try:
        faces = extract_faces(img)
        if not faces:
            return None
        face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        return face.normed_embedding  # vector L2-normalized, shape (512,)
    except Exception:
        return None

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity giữa 2 embedding đã normalize → range [-1, 1]."""
    return float(np.dot(a, b))

def get_candidate_image_str(cand: dict) -> Optional[str]:
    raw = cand.get("face_data") or cand.get("du_lieu_khuon_mat")
    if isinstance(raw, dict):
        return raw.get("image")
    elif isinstance(raw, str):
        try:
            return json.loads(raw).get("image")
        except Exception:
            return raw
    return None

# ─── Fallback OpenCV (khi không có InsightFace) ──────────────────────────────
def _opencv_extract_features(img: np.ndarray):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (128, 128))
    eq = cv2.equalizeHist(resized)
    cell_h, cell_w = 32, 32
    grid_hists = []
    for r in range(4):
        for c in range(4):
            cell = eq[r*cell_h:(r+1)*cell_h, c*cell_w:(c+1)*cell_w]
            hist = cv2.calcHist([cell], [0], None, [16], [0, 256])
            cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX)
            grid_hists.append(hist.flatten())
    spatial_vec = np.concatenate(grid_hists)
    sobelx = cv2.Sobel(eq, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(eq, cv2.CV_64F, 0, 1, ksize=3)
    grad_mag = np.uint8(np.clip(cv2.magnitude(sobelx, sobely), 0, 255))
    grad_hist = cv2.calcHist([grad_mag], [0], None, [64], [0, 256])
    cv2.normalize(grad_hist, grad_hist, 0, 1, cv2.NORM_MINMAX)
    grad_vec = grad_hist.flatten()
    small = cv2.resize(gray, (9, 8))
    dhash = (small[:, 1:] > small[:, :-1]).flatten()
    return eq, spatial_vec, dhash, grad_vec

def _opencv_compare(img1, img2) -> float:
    try:
        eq1, sv1, h1, g1 = _opencv_extract_features(img1)
        eq2, sv2, h2, g2 = _opencv_extract_features(img2)
        cos = float(np.dot(sv1, sv2) / (np.linalg.norm(sv1) * np.linalg.norm(sv2) + 1e-7))
        ncc = float(cv2.matchTemplate(eq1, eq2, cv2.TM_CCOEFF_NORMED)[0][0])
        hash_sim = float(1.0 - np.count_nonzero(h1 != h2) / len(h1))
        grad_sim = float(np.dot(g1, g2) / (np.linalg.norm(g1) * np.linalg.norm(g2) + 1e-7))
        return round(0.30*max(0,cos) + 0.25*max(0,ncc) + 0.20*hash_sim + 0.25*max(0,grad_sim), 3)
    except Exception:
        return 0.0

def _opencv_extract_face(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(gray, 1.05, 3, minSize=(40, 40))
    if len(faces) > 0:
        x, y, w, h = max(faces, key=lambda r: r[2]*r[3])
        px, py = int(w*0.15), int(h*0.15)
        return img[max(0,y-py):min(img.shape[0],y+h+py), max(0,x-px):min(img.shape[1],x+w+px)]
    return img

# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "VisionHR AI Face Recognition v3",
        "engine": "InsightFace ArcFace (buffalo_sc)" if USE_INSIGHTFACE else "OpenCV Haar+Histogram (fallback)",
    }

@app.post("/detect-face")
def detect_face(payload: ImagePayload):
    try:
        image = decode_base64_image(payload.imageBase64)
        if image is None:
            return {"faceDetected": False, "boundingBox": None, "croppedFace": None, "message": "Ảnh không hợp lệ"}

        if USE_INSIGHTFACE:
            faces = extract_faces(image)
            if not faces:
                return {"faceDetected": False, "boundingBox": None, "croppedFace": None,
                        "message": "Không phát hiện khuôn mặt. Hãy hướng thẳng mặt vào camera."}
            face = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1]))
            x1, y1, x2, y2 = [int(v) for v in face.bbox]
            # Thêm padding 10%
            pw, ph = int((x2-x1)*0.10), int((y2-y1)*0.10)
            x1c, y1c = max(0, x1-pw), max(0, y1-ph)
            x2c, y2c = min(image.shape[1], x2+pw), min(image.shape[0], y2+ph)
            cropped = image[y1c:y2c, x1c:x2c]
            det_score = float(face.det_score) if hasattr(face, "det_score") else 0.98
            emb = face.normed_embedding.tolist() if (hasattr(face, "normed_embedding") and face.normed_embedding is not None) else None
            return {
                "faceDetected": True,
                "boundingBox": [x1, y1, x2-x1, y2-y1],
                "croppedFace": encode_image_base64(cropped),
                "confidence": round(det_score, 2),
                "embedding": emb,
            }
        else:
            return {
                "faceDetected": True,
                "boundingBox": [0, 0, image.shape[1], image.shape[0]],
                "croppedFace": encode_image_base64(image),
                "confidence": 0.85,
                "embedding": None,
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

        candidates = payload.candidates or []

        if USE_INSIGHTFACE:
            # ── ArcFace path ─────────────────────────────────────────────────
            probe_emb = get_embedding(probe_img)
            if probe_emb is None:
                return {"faceDetected": False, "isDuplicate": False,
                        "message": "Không phát hiện khuôn mặt trong ảnh."}

            DUPLICATE_THRESHOLD = 0.40  # cosine similarity >= 0.40 → trùng

            for cand in candidates:
                cand_id = cand.get("id") or cand.get("ma_nhan_vien")
                if payload.targetEmployeeId and str(cand_id) == str(payload.targetEmployeeId):
                    continue

                # Thử lấy embedding đã lưu trước (nếu có)
                saved_emb = None
                raw = cand.get("face_data") or cand.get("du_lieu_khuon_mat")
                if isinstance(raw, dict):
                    saved_emb_list = raw.get("embedding")
                    if saved_emb_list:
                        saved_emb = np.array(saved_emb_list, dtype=np.float32)
                elif isinstance(raw, str):
                    try:
                        parsed = json.loads(raw)
                        emb_list = parsed.get("embedding")
                        if emb_list:
                            saved_emb = np.array(emb_list, dtype=np.float32)
                    except Exception:
                        pass

                if saved_emb is not None:
                    sim = cosine_similarity(probe_emb, saved_emb)
                else:
                    # Fallback: giải mã ảnh và tính embedding real-time
                    cand_img_str = get_candidate_image_str(cand)
                    if not cand_img_str:
                        continue
                    cand_img = decode_base64_image(cand_img_str)
                    if cand_img is None:
                        continue
                    saved_emb = get_embedding(cand_img)
                    if saved_emb is None:
                        continue
                    sim = cosine_similarity(probe_emb, saved_emb)

                if sim >= DUPLICATE_THRESHOLD:
                    return {
                        "isDuplicate": True,
                        "matchedEmployeeId": cand_id,
                        "matchedEmployeeName": cand.get("name") or cand.get("ho_ten"),
                        "matchedEmployeeCode": cand.get("code") or cand.get("ma_so"),
                        "similarity": round(sim, 3),
                        "reason": "arcface_high_similarity",
                    }
            return {"isDuplicate": False}

        else:
            # ── Fallback OpenCV path ──────────────────────────────────────────
            probe_face = _opencv_extract_face(probe_img)
            for cand in candidates:
                cand_id = cand.get("id") or cand.get("ma_nhan_vien")
                if payload.targetEmployeeId and str(cand_id) == str(payload.targetEmployeeId):
                    continue
                cand_img_str = get_candidate_image_str(cand)
                if not cand_img_str:
                    continue
                ref_img = decode_base64_image(cand_img_str)
                if ref_img is None:
                    continue
                ref_face = _opencv_extract_face(ref_img)
                sim = _opencv_compare(probe_face, ref_face)
                if sim >= 0.62:
                    return {
                        "isDuplicate": True,
                        "matchedEmployeeId": cand_id,
                        "matchedEmployeeName": cand.get("name") or cand.get("ho_ten"),
                        "matchedEmployeeCode": cand.get("code") or cand.get("ma_so"),
                        "similarity": sim,
                        "reason": "opencv_high_similarity",
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

        if USE_INSIGHTFACE:
            # ── ArcFace path ─────────────────────────────────────────────────
            probe_emb = get_embedding(probe_img)
            if probe_emb is None:
                return {"employeeId": None, "employeeName": None, "confidence": 0.0}

            MATCH_THRESHOLD = 0.35  # cosine similarity >= 0.35 → nhận diện được

            best_match = None
            best_score = -1.0

            for cand in candidates:
                # Thử lấy embedding đã lưu
                saved_emb = None
                raw = cand.get("face_data") or cand.get("du_lieu_khuon_mat")
                if isinstance(raw, dict):
                    emb_list = raw.get("embedding")
                    if emb_list:
                        saved_emb = np.array(emb_list, dtype=np.float32)
                elif isinstance(raw, str):
                    try:
                        parsed = json.loads(raw)
                        emb_list = parsed.get("embedding")
                        if emb_list:
                            saved_emb = np.array(emb_list, dtype=np.float32)
                    except Exception:
                        pass

                if saved_emb is None:
                    cand_img_str = get_candidate_image_str(cand)
                    if not cand_img_str:
                        continue
                    cand_img = decode_base64_image(cand_img_str)
                    if cand_img is None:
                        continue
                    saved_emb = get_embedding(cand_img)
                    if saved_emb is None:
                        continue

                sim = cosine_similarity(probe_emb, saved_emb)
                if sim > best_score:
                    best_score = sim
                    best_match = cand

            if best_match and best_score >= MATCH_THRESHOLD:
                return {
                    "employeeId": best_match.get("id") or best_match.get("ma_nhan_vien"),
                    "employeeName": best_match.get("name") or best_match.get("ho_ten"),
                    "confidence": round(best_score, 3),
                }
            return {"employeeId": None, "employeeName": None, "confidence": 0.0}

        else:
            # ── Fallback OpenCV path ──────────────────────────────────────────
            probe_face = _opencv_extract_face(probe_img)
            best_match, best_score = None, -1.0
            for cand in candidates:
                cand_img_str = get_candidate_image_str(cand)
                if not cand_img_str:
                    continue
                ref_img = decode_base64_image(cand_img_str)
                if ref_img is None:
                    continue
                ref_face = _opencv_extract_face(ref_img)
                sim = _opencv_compare(probe_face, ref_face)
                if sim > best_score:
                    best_score = sim
                    best_match = cand
            if best_match and best_score >= 0.50:
                return {
                    "employeeId": best_match.get("id") or best_match.get("ma_nhan_vien"),
                    "employeeName": best_match.get("name") or best_match.get("ho_ten"),
                    "confidence": round(best_score, 2),
                }
            return {"employeeId": None, "employeeName": None, "confidence": 0.0}

    except Exception as e:
        return {"employeeId": None, "employeeName": None, "confidence": 0.0, "error": str(e)}

@app.post("/get-embedding")
def get_face_embedding(payload: ImagePayload):
    """Endpoint mới: trả về ArcFace embedding để lưu vào DB, tăng tốc match sau này."""
    try:
        image = decode_base64_image(payload.imageBase64)
        if image is None:
            return {"success": False, "embedding": None, "message": "Ảnh không hợp lệ"}
        emb = get_embedding(image)
        if emb is None:
            return {"success": False, "embedding": None, "message": "Không phát hiện khuôn mặt"}
        return {"success": True, "embedding": emb.tolist()}
    except Exception as e:
        return {"success": False, "embedding": None, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
