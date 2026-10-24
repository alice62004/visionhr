-- VisionHR - Database Schema (MySQL)
CREATE DATABASE IF NOT EXISTS visionhr CHARACTER SET utf8mb4;
USE visionhr;

-- Bảng phòng ban
CREATE TABLE phong_ban (
  ma_phong_ban INT AUTO_INCREMENT PRIMARY KEY,
  ten_phong_ban VARCHAR(150) NOT NULL,
  ma_truong_phong INT NULL
);

-- Bảng nhân viên
CREATE TABLE nhan_vien (
  ma_nhan_vien INT AUTO_INCREMENT PRIMARY KEY,
  ma_so VARCHAR(30) UNIQUE NOT NULL,
  ho_ten VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  so_dien_thoai VARCHAR(20),
  ma_phong_ban INT NULL,
  chuc_vu VARCHAR(100),
  bang_cap VARCHAR(100) NULL,
  chuyen_nganh VARCHAR(150) NULL,
  ngay_sinh DATE NULL,
  gioi_tinh ENUM('nam', 'nu', 'khac') DEFAULT 'nam',
  so_cccd VARCHAR(20) NULL,
  dia_chi VARCHAR(255) NULL,
  trang_thai ENUM('dang_lam_viec', 'da_nghi_viec') DEFAULT 'dang_lam_viec',
  ngay_vao_lam DATE,
  du_lieu_khuon_mat JSON NULL,
  FOREIGN KEY (ma_phong_ban) REFERENCES phong_ban(ma_phong_ban) ON DELETE SET NULL
);

ALTER TABLE phong_ban
  ADD CONSTRAINT fk_phong_ban_truong_phong FOREIGN KEY (ma_truong_phong) REFERENCES nhan_vien(ma_nhan_vien) ON DELETE SET NULL;

-- Tài khoản đăng nhập, gắn với role và (tuỳ chọn) 1 employee cụ thể
CREATE TABLE tai_khoan (
  ma_tai_khoan INT AUTO_INCREMENT PRIMARY KEY,
  ho_ten VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  mat_khau_hash VARCHAR(255) NOT NULL,
  vai_tro ENUM('admin', 'hr', 'manager', 'employee') NOT NULL DEFAULT 'employee',
  ma_nhan_vien INT NULL UNIQUE,
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_nhan_vien) REFERENCES nhan_vien(ma_nhan_vien) ON DELETE SET NULL
);

-- Bảng ca làm việc
CREATE TABLE ca_lam_viec (
  ma_ca INT AUTO_INCREMENT PRIMARY KEY,
  ten_ca VARCHAR(100) NOT NULL,
  gio_bat_dau TIME NOT NULL,
  gio_ket_thuc TIME NOT NULL,
  ma_phong_ban INT NULL,
  FOREIGN KEY (ma_phong_ban) REFERENCES phong_ban(ma_phong_ban) ON DELETE SET NULL
);

-- Bảng chấm công
CREATE TABLE cham_cong (
  ma_cham_cong INT AUTO_INCREMENT PRIMARY KEY,
  ma_nhan_vien INT NOT NULL,
  ngay DATE NOT NULL,
  gio_vao TIME NULL,
  gio_ra TIME NULL,
  trang_thai ENUM('dung_gio', 'di_muon', 'vang_mat') DEFAULT 'dung_gio',
  phuong_thuc ENUM('nhan_dien_khuon_mat', 'thu_cong') DEFAULT 'nhan_dien_khuon_mat',
  anh_vao VARCHAR(255) NULL,
  anh_ra VARCHAR(255) NULL,
  FOREIGN KEY (ma_nhan_vien) REFERENCES nhan_vien(ma_nhan_vien) ON DELETE CASCADE
);

-- Bảng đơn nghỉ phép
CREATE TABLE don_nghi_phep (
  ma_don INT AUTO_INCREMENT PRIMARY KEY,
  ma_nhan_vien INT NOT NULL,
  loai_phep VARCHAR(50) NOT NULL,
  tu_ngay DATE NOT NULL,
  den_ngay DATE NOT NULL,
  ly_do VARCHAR(255),
  trang_thai ENUM('cho_duyet', 'da_duyet', 'tu_choi') DEFAULT 'cho_duyet',
  ly_do_tu_choi TEXT NULL,
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_nhan_vien) REFERENCES nhan_vien(ma_nhan_vien) ON DELETE CASCADE
);

-- Bảng đơn đăng ký tăng ca (OT)
CREATE TABLE don_tang_ca (
  ma_don INT AUTO_INCREMENT PRIMARY KEY,
  ma_nhan_vien INT NOT NULL,
  ngay DATE NOT NULL,
  so_gio DECIMAL(4,1) NOT NULL,
  ly_do VARCHAR(255),
  trang_thai ENUM('cho_duyet', 'da_duyet', 'tu_choi') DEFAULT 'cho_duyet',
  ly_do_tu_choi TEXT NULL,
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_nhan_vien) REFERENCES nhan_vien(ma_nhan_vien) ON DELETE CASCADE
);

-- Bảng lương
CREATE TABLE bang_luong (
  ma_bang_luong INT AUTO_INCREMENT PRIMARY KEY,
  ma_nhan_vien INT NOT NULL,
  thang VARCHAR(7) NOT NULL, -- format: YYYY-MM
  luong_co_ban DECIMAL(12,2) NOT NULL,
  luong_tang_ca DECIMAL(12,2) DEFAULT 0,
  luong_thuc_nhan DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (ma_nhan_vien) REFERENCES nhan_vien(ma_nhan_vien) ON DELETE CASCADE
);

-- Nhật ký hệ thống (Audit log)
CREATE TABLE nhat_ky_he_thong (
  ma_nhat_ky INT AUTO_INCREMENT PRIMARY KEY,
  ma_tai_khoan INT NULL,
  hanh_dong VARCHAR(150) NOT NULL,
  chuc_nang VARCHAR(100) NOT NULL,
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE SET NULL
);

-- Bảng hợp đồng lao động
CREATE TABLE hop_dong_lao_dong (
  ma_hop_dong INT AUTO_INCREMENT PRIMARY KEY,
  so_hop_dong VARCHAR(50) UNIQUE NOT NULL,
  ma_nhan_vien INT NOT NULL,
  loai_hop_dong ENUM('thu_viec', 'xac_dinh_thoi_han', 'khong_xac_dinh_thoi_han', 'thoi_vu') NOT NULL DEFAULT 'xac_dinh_thoi_han',
  ngay_ky DATE NOT NULL,
  ngay_hieu_luc DATE NOT NULL,
  ngay_het_han DATE NULL,
  luong_co_ban DECIMAL(12, 2) NOT NULL DEFAULT 0,
  luong_dong_bao_hiem DECIMAL(12, 2) NOT NULL DEFAULT 0,
  so_cong_chuan INT NOT NULL DEFAULT 26,
  so_ngay_phep_nam INT NOT NULL DEFAULT 12,
  phan_tram_luong INT NOT NULL DEFAULT 100,
  chuc_danh VARCHAR(150) NULL,
  dia_diem_lam_viec VARCHAR(255) DEFAULT 'Trụ sở chính VisionHR',
  ghi_chu TEXT NULL,
  trang_thai ENUM('hieu_luc', 'sap_het_han', 'het_han', 'da_cham_dut') NOT NULL DEFAULT 'hieu_luc',
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_nhan_vien) REFERENCES nhan_vien(ma_nhan_vien) ON DELETE CASCADE
);
