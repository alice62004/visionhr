-- VisionHR - Dữ liệu mẫu
USE visionhr;

INSERT INTO phong_ban (ten_phong_ban) VALUES
('Kỹ thuật Công nghệ'), ('Kinh doanh (Sales)'), ('Sản xuất (Factory)'),
('Marketing & Branding'), ('Khối văn phòng & HR');

INSERT INTO nhan_vien (ma_so, ho_ten, email, so_dien_thoai, ma_phong_ban, chuc_vu, bang_cap, chuyen_nganh, ngay_sinh, gioi_tinh, so_cccd, dia_chi, trang_thai, ngay_vao_lam) VALUES
('NV001', 'Nguyễn Văn An', 'an.nguyen@visionhr.vn', '0901111111', 1, 'Lập trình viên Frontend', 'Cử nhân Đại học', 'Kỹ thuật Phần mềm', '1998-05-15', 'nam', '079198004567', '123 Nguyễn Huệ, Quận 1, TP.HCM', 'dang_lam_viec', '2023-03-01'),
('NV002', 'Trần Thị Bình', 'binh.tran@visionhr.vn', '0902222222', 5, 'Trưởng phòng Nhân sự', 'Thạc sĩ Quản trị', 'Quản trị Nguồn nhân lực', '1992-10-20', 'nu', '079192003456', '456 Lê Duẩn, Quận 1, TP.HCM', 'dang_lam_viec', '2022-01-10'),
('NV003', 'Lê Văn Cường', 'cuong.le@visionhr.vn', '0903333333', 2, 'Chuyên viên Kinh doanh', 'Cử nhân Đại học', 'Quản trị Kinh doanh', '2000-02-08', 'nam', '079200001234', '789 Trần Hưng Đạo, Quận 5, TP.HCM', 'dang_lam_viec', '2023-07-15');

-- Mật khẩu mẫu cho tất cả tài khoản demo: 123456
-- (hash bcrypt bên dưới tương ứng với "123456")
INSERT INTO tai_khoan (ho_ten, email, mat_khau_hash, vai_tro, ma_nhan_vien) VALUES
('Admin hệ thống', 'admin@visionhr.vn', '$2a$10$mMNWirbuKFsIauG81vDh0erv1PcqrC6iXjA4neKBdZ0wQ.kA.HKCW', 'admin', NULL),
('Trần Thị Bình', 'binh.tran@visionhr.vn', '$2a$10$mMNWirbuKFsIauG81vDh0erv1PcqrC6iXjA4neKBdZ0wQ.kA.HKCW', 'hr', 2),
('Lê Văn Cường (Quản lý)', 'manager@visionhr.vn', '$2a$10$mMNWirbuKFsIauG81vDh0erv1PcqrC6iXjA4neKBdZ0wQ.kA.HKCW', 'manager', 3),
('Nguyễn Văn An', 'an.nguyen@visionhr.vn', '$2a$10$mMNWirbuKFsIauG81vDh0erv1PcqrC6iXjA4neKBdZ0wQ.kA.HKCW', 'employee', 1);

INSERT INTO ca_lam_viec (ten_ca, gio_bat_dau, gio_ket_thuc, ma_phong_ban) VALUES
('Ca hành chính', '08:00:00', '17:00:00', NULL),
('Ca sản xuất sáng', '06:00:00', '14:00:00', 3);

INSERT INTO cham_cong (ma_nhan_vien, ngay, gio_vao, gio_ra, trang_thai, phuong_thuc) VALUES
(1, CURDATE(), '08:05:00', '17:10:00', 'dung_gio', 'nhan_dien_khuon_mat'),
(2, CURDATE(), '07:55:00', '17:05:00', 'dung_gio', 'nhan_dien_khuon_mat'),
(3, CURDATE(), '08:35:00', NULL, 'di_muon', 'nhan_dien_khuon_mat');

-- Gán trưởng phòng cho các phòng ban
UPDATE phong_ban SET ma_truong_phong = 2 WHERE ma_phong_ban = 5; -- Trần Thị Bình phụ trách Khối VP & HR
UPDATE phong_ban SET ma_truong_phong = 1 WHERE ma_phong_ban = 1; -- Nguyễn Văn An phụ trách Kỹ thuật
UPDATE phong_ban SET ma_truong_phong = 3 WHERE ma_phong_ban = 2; -- Lê Văn Cường phụ trách Kinh doanh

-- Bảng đơn nghỉ phép
INSERT INTO don_nghi_phep (ma_nhan_vien, loai_phep, tu_ngay, den_ngay, ly_do, trang_thai, ly_do_tu_choi) VALUES
(1, 'Nghỉ phép năm', DATE_ADD(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Nghỉ phép việc gia đình', 'cho_duyet', NULL),
(3, 'Nghỉ bệnh', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'Cảm sốt có giấy chứng nhận y tế', 'da_duyet', NULL),
(2, 'Nghỉ việc riêng', DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Đi giải quyết việc cá nhân', 'da_duyet', NULL);

-- Bảng đơn đăng ký tăng ca (OT)
INSERT INTO don_tang_ca (ma_nhan_vien, ngay, so_gio, ly_do, trang_thai, ly_do_tu_choi) VALUES
(1, CURDATE(), 2.0, 'Hỗ trợ deploy bản cập nhật hệ thống', 'da_duyet', NULL),
(3, CURDATE(), 1.5, 'Tư vấn và chốt hợp đồng khách hàng dự án', 'cho_duyet', NULL);

-- Bảng lương mẫu
INSERT INTO bang_luong (ma_nhan_vien, thang, luong_co_ban, luong_tang_ca, luong_thuc_nhan) VALUES
(1, DATE_FORMAT(CURDATE(), '%Y-%m'), 20000000, 1500000, 21500000),
(2, DATE_FORMAT(CURDATE(), '%Y-%m'), 25000000, 0, 25000000),
(3, DATE_FORMAT(CURDATE(), '%Y-%m'), 15000000, 2000000, 17000000);

-- Nhật ký hệ thống mẫu
INSERT INTO nhat_ky_he_thong (ma_tai_khoan, hanh_dong, chuc_nang) VALUES
(1, 'Đăng nhập vào hệ thống', 'Xác thực'),
(1, 'Cấu hình ca làm việc mới', 'Ca làm việc'),
(2, 'Duyệt đơn nghỉ phép cho NV003', 'Nghỉ phép'),
(3, 'Chấm công nhận diện khuôn mặt', 'Chấm công');

-- Hợp đồng lao động mẫu
INSERT INTO hop_dong_lao_dong 
(so_hop_dong, ma_nhan_vien, loai_hop_dong, ngay_ky, ngay_hieu_luc, ngay_het_han, luong_co_ban, luong_dong_bao_hiem, so_cong_chuan, so_ngay_phep_nam, phan_tram_luong, chuc_danh, trang_thai)
VALUES
('HDLD-2026/001', 1, 'xac_dinh_thoi_han', '2026-01-01', '2026-01-01', '2026-12-31', 20000000, 5000000, 26, 12, 100, 'Lập trình viên Frontend', 'hieu_luc'),
('HDLD-VC/002', 2, 'khong_xac_dinh_thoi_han', '2025-01-10', '2025-01-10', NULL, 25000000, 6000000, 26, 14, 100, 'Trưởng phòng Nhân sự', 'hieu_luc'),
('HDLD-2025/003', 3, 'xac_dinh_thoi_han', '2025-11-01', '2025-11-01', DATE_ADD(CURDATE(), INTERVAL 15 DAY), 18000000, 5000000, 26, 12, 100, 'Chuyên viên Kinh doanh', 'sap_het_han');

