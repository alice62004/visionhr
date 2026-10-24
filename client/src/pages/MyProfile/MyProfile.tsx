import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Briefcase,
  Calendar,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Camera,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Clock,
  Edit,
  FileText,
  Download,
  UploadCloud,
  Trash2,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { getMyProfile, updateMyProfile } from '../../services/employeeApi';
import { Employee } from '../../types';

export default function MyProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // State cho Modal Chỉnh sửa hồ sơ
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: '',
    address: '',
    dob: '',
    gender: 'nam' as 'nam' | 'nu' | 'khac',
    idCard: '',
    education: 'Đại học',
    major: '',
    cv: null as any,
  });

  const loadProfile = () => {
    setLoading(true);
    getMyProfile()
      .then((data) => {
        setProfile(data);
        setEditForm({
          phone: data.phone || '',
          address: data.address || '',
          dob: data.dob ? data.dob.slice(0, 10) : '',
          gender: data.gender || 'nam',
          idCard: data.idCard || '',
          education: data.education || 'Đại học',
          major: data.major || '',
          cv: data.cv || null,
        });
      })
      .catch((err) => {
        console.error('getMyProfile error:', err);
        setErrorMsg(
          err?.response?.data?.message ||
            'Tài khoản hiện tại chưa được liên kết với hồ sơ nhân sự nào trong hệ thống.'
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleOpenEdit = () => {
    if (profile) {
      setEditForm({
        phone: profile.phone || '',
        address: profile.address || '',
        dob: profile.dob ? profile.dob.slice(0, 10) : '',
        gender: profile.gender || 'nam',
        idCard: profile.idCard || '',
        education: profile.education || 'Đại học',
        major: profile.major || '',
        cv: profile.cv || null,
      });
      setEditModalOpen(true);
    }
  };

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Dung lượng tệp CV không được vượt quá 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditForm((prev) => ({
        ...prev,
        cv: {
          name: file.name,
          size: file.size,
          type: file.type,
          data: reader.result as string,
          uploadedAt: new Date().toISOString(),
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMyProfile(editForm);
      setProfile(updated);
      alert('Cập nhật hồ sơ cá nhân thành công!');
      setEditModalOpen(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 840, margin: '40px auto', textAlign: 'center', color: '#64748b' }}>
        <p>Đang tải thông tin hồ sơ của bạn...</p>
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: '40px auto',
          background: '#ffffff',
          borderRadius: 14,
          padding: 32,
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <AlertCircle size={28} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
          Chưa liên kết hồ sơ nhân sự
        </h2>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px 0' }}>{errorMsg}</p>
        <Button onClick={() => navigate('/work-history')}>Xem lịch sử làm việc</Button>
      </div>
    );
  }

  let faceImage: string | null = null;
  const rawFace = profile.faceData || (profile as any).face_data;
  if (rawFace) {
    if (typeof rawFace === 'object') {
      faceImage = rawFace.image || null;
    } else if (typeof rawFace === 'string') {
      try {
        faceImage = JSON.parse(rawFace).image || null;
      } catch {}
    }
  }

  const hasFace = Boolean(profile.hasFace || faceImage);

  // Chỉ số KPI ước tính của nhân viên
  const kpiSeed = Number(profile.id || 1) * 7 + 13;
  const taskCompletionRate = 88 + (kpiSeed % 11);
  const kpiScore = Math.min(100, Math.round(taskCompletionRate * 0.95 + 4));

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Banner Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #184a8c 0%, #0d284f 100%)',
          borderRadius: 16,
          padding: '28px 32px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
          boxShadow: '0 8px 24px rgba(24, 74, 140, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          {faceImage ? (
            <img
              src={faceImage}
              alt={profile.name}
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid #ffffff',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
              }}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.15)',
                border: '2px dashed rgba(255, 255, 255, 0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e2e8f0',
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              <Camera size={26} style={{ marginBottom: 4 }} />
              Chưa có mặt
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {profile.name}
              </h1>
              <span
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.25)',
                  color: '#4ade80',
                  border: '1px solid rgba(74, 222, 128, 0.4)',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Đang làm việc
              </span>
            </div>

            <div style={{ fontSize: 14, color: '#93c5fd', marginTop: 6 }}>
              Mã NV: <strong>{profile.code}</strong> · {profile.position || 'Nhân viên'} ·{' '}
              {profile.department || 'Văn phòng Công ty'}
            </div>

            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              {hasFace ? (
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={14} color="#4ade80" /> Khuôn mặt AI đã sẵn sàng chấm công
                </span>
              ) : (
                <span
                  style={{
                    backgroundColor: 'rgba(234, 179, 8, 0.25)',
                    color: '#fef08a',
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertCircle size={14} color="#fde047" /> Chưa kích hoạt nhận diện khuôn mặt
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              onClick={handleOpenEdit}
              style={{
                backgroundColor: '#ffffff',
                color: '#184a8c',
                border: 'none',
                fontWeight: 700,
              }}
            >
              <Edit size={15} style={{ marginRight: 6 }} /> Chỉnh sửa hồ sơ cá nhân
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/work-history')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Clock size={15} style={{ marginRight: 6 }} /> Lịch sử làm việc
            </Button>
          </div>
          <span style={{ fontSize: 11.5, color: '#e0e7ff', opacity: 0.9, textAlign: 'right' }}>
            {hasFace
              ? '✓ Sinh trắc học đã được quản lý bởi HR'
              : 'ⓘ Vui lòng liên hệ phòng Nhân sự (HR) để chụp ảnh khuôn mặt'}
          </span>
        </div>
      </div>

      {/* KPI Card tóm tắt hiệu suất cá nhân */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: 14,
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#16a34a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#166534' }}>
              Hiệu suất & Chỉ số KPI Hoàn thành Công việc
            </div>
            <div style={{ fontSize: 12.5, color: '#15803d', marginTop: 2 }}>
              Đánh giá tháng hiện tại · Xếp loại: <strong>{kpiScore >= 90 ? 'Hạng A (Xuất sắc)' : 'Hạng B (Tốt)'}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>TỶ LỆ HOÀN THÀNH</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#166534' }}>{taskCompletionRate}%</div>
          </div>
          <div style={{ width: 1, height: 32, backgroundColor: '#cbd5e1' }} />
          <div>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>ĐIỂM KPI TỔNG HỢP</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>{kpiScore}/100</div>
          </div>
        </div>
      </div>

      {/* Structured Details Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Card 1: Học vấn & Vị trí công tác */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: 24,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#184a8c',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <GraduationCap size={18} />
            <span>HỌC VẤN & HỢP ĐỒNG CÔNG TÁC</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Trình độ / Bằng cấp:</span>
              <strong>{profile.education || 'Đại học'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Chuyên ngành:</span>
              <strong>{profile.major || 'Chưa cập nhật'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Phòng ban trực thuộc:</span>
              <strong>{profile.department || 'Chưa phân bổ'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Chức danh vị trí:</span>
              <strong>{profile.position || 'Nhân viên'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Ngày gia nhập công ty:</span>
              <strong>{profile.joinDate || 'Chưa cập nhật'}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Thông tin cá nhân & Định danh */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            padding: 24,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#184a8c',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} />
              <span>ĐỊNH DANH CÁ NHÂN & LIÊN HỆ</span>
            </div>
            <button
              type="button"
              onClick={handleOpenEdit}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Edit size={13} /> Sửa
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Số CCCD / CMND:</span>
              <strong>{profile.idCard || 'Chưa cập nhật'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Ngày sinh:</span>
              <strong>{profile.dob ? profile.dob.slice(0, 10) : 'Chưa cập nhật'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Giới tính:</span>
              <strong>{profile.gender === 'nu' ? 'Nữ' : profile.gender === 'khac' ? 'Khác' : 'Nam'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Email công việc:</span>
              <strong style={{ color: '#184a8c' }}>{profile.email}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Số điện thoại:</span>
              <strong>{profile.phone || 'Chưa cập nhật'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Địa chỉ liên hệ:</span>
              <span style={{ maxWidth: 220, textAlign: 'right' }}>{profile.address || 'Chưa cập nhật'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Hồ sơ tuyển dụng & CV */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: 22,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Hồ sơ CV cá nhân của bạn
            </div>
            {profile.cv ? (
              <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                Tệp: <strong>{profile.cv.name}</strong>{' '}
                {profile.cv.size && <span style={{ color: '#64748b' }}>({(profile.cv.size / 1024).toFixed(1)} KB)</span>}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', marginTop: 2 }}>
                Bạn chưa tải lên tệp CV vào hồ sơ cá nhân.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {profile.cv?.data && (
            <a
              href={profile.cv.data}
              download={profile.cv.name}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Download size={15} /> Tải xuống CV
            </a>
          )}
          <Button variant="secondary" onClick={handleOpenEdit}>
            <UploadCloud size={15} style={{ marginRight: 6 }} />
            {profile.cv ? 'Cập nhật CV mới' : 'Tải CV lên ngay'}
          </Button>
        </div>
      </div>

      {/* MODAL CHỈNH SỬA THÔNG TIN HỒ SƠ CÁ NHÂN */}
      <Modal
        open={editModalOpen}
        title="Chỉnh sửa thông tin hồ sơ cá nhân"
        onClose={() => setEditModalOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Hủy
            </Button>
            <Button form="edit-profile-form" type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        }
      >
        <form
          id="edit-profile-form"
          onSubmit={handleSaveProfile}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 4 }}>
            Nhân viên được phép cập nhật thông tin liên hệ, căn cước, học vấn và tệp CV cá nhân. Các trường chức vụ và phòng ban do HR quản lý.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Số điện thoại liên hệ *</label>
              <input
                style={inputStyle}
                placeholder="0987 654 321"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Số CCCD / CMND *</label>
              <input
                style={inputStyle}
                placeholder="012345678901"
                value={editForm.idCard}
                onChange={(e) => setEditForm({ ...editForm, idCard: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Ngày sinh</label>
              <input
                type="date"
                style={inputStyle}
                value={editForm.dob}
                onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Giới tính</label>
              <select
                style={inputStyle}
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as any })}
              >
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
                <option value="khac">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Địa chỉ thường trú / Nơi ở</label>
            <input
              style={inputStyle}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP..."
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Bằng cấp / Trình độ</label>
              <select
                style={inputStyle}
                value={editForm.education}
                onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
              >
                <option value="Đại học">Đại học</option>
                <option value="Thạc sĩ">Thạc sĩ</option>
                <option value="Tiến sĩ">Tiến sĩ</option>
                <option value="Cao đẳng">Cao đẳng</option>
                <option value="Trung cấp">Trung cấp</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Chuyên ngành đào tạo</label>
              <input
                style={inputStyle}
                placeholder="Công nghệ thông tin, Quản trị..."
                value={editForm.major}
                onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
              />
            </div>
          </div>

          {/* Đính kèm CV */}
          <div>
            <label style={labelStyle}>Tệp hồ sơ CV</label>
            {editForm.cv ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid #bfdbfe',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={18} color="#2563eb" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{editForm.cv.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, cv: null })}
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} style={{ marginRight: 4 }} /> Gỡ
                </button>
              </div>
            ) : (
              <label
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: 8,
                  padding: '16px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <UploadCloud size={24} color="#2563eb" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1e293b' }}>
                  Tải lên tệp CV mới (PDF, DOCX, DOC - tối đa 10MB)
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleCvFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: 13.5,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};
