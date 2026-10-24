/**
 * cameraUtils.ts - Tiện ích chuẩn hóa lỗi Camera/Webcam cho toàn bộ hệ thống VisionHR
 */

export function getCameraErrorMessage(error: string | DOMException | unknown): string {
  if (!error) {
    return 'Không thể mở camera. Vui lòng cấp quyền webcam hoặc tắt app đang dùng camera.';
  }

  const errName =
    typeof error === 'object' && error !== null && 'name' in error
      ? (error as { name: string }).name
      : String(error);

  if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
    return 'Quyền Camera bị chặn. Vui lòng cấp quyền Camera trên trình duyệt rồi tải lại trang.';
  }

  if (errName === 'NotReadableError' || errName === 'TrackStartError') {
    return 'Camera đang bị ứng dụng khác (Zoom, Zalo, Teams...) chiếm dụng. Vui lòng đóng app đó.';
  }

  if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
    return 'Không tìm thấy thiết bị webcam kết nối với máy tính.';
  }

  return 'Không thể mở camera. Vui lòng cấp quyền webcam hoặc tắt app đang dùng camera.';
}
