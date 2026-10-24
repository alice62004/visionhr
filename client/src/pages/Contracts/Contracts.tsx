import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye,
  Trash2,
  FileCheck2,
  Printer,
  Info,
} from 'lucide-react';
import {
  Contract,
  ContractStats,
  ContractType,
  ContractStatus,
  getContracts,
  getContractStats,
  createContract,
  renewContract,
  terminateContract,
  getNextContractCode,
} from '../../services/contractApi';
import { getEmployees, getDepartments } from '../../services/employeeApi';
import { useAuthStore } from '../../store/authStore';
import { Employee, Department } from '../../types';
import Button from '../../components/Button/Button';
import { formatVND } from '../../utils/formatters';
import ContractFormModal from './ContractFormModal';
import ContractRenewModal from './ContractRenewModal';
import ContractDetailModal from './ContractDetailModal';

const CONTRACT_TYPE_MAP: Record<ContractType, { label: string; bg: string; color: string; border: string }> = {
  thu_viec: { label: 'Thử việc (85%)', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  xac_dinh_thoi_han: { label: 'Xác định thời hạn', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  khong_xac_dinh_thoi_han: { label: 'Không thời hạn', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  thoi_vu: { label: 'Thời vụ / CTV', bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
};

const CONTRACT_STATUS_MAP: Record<ContractStatus, { label: string; bg: string; color: string }> = {
  hieu_luc: { label: 'Đang hiệu lực', bg: '#dcfce7', color: '#166534' },
  sap_het_han: { label: 'Sắp hết hạn', bg: '#fef3c7', color: '#92400e' },
  het_han: { label: 'Đã hết hạn', bg: '#fee2e2', color: '#991b1b' },
  da_cham_dut: { label: 'Đã thanh lý', bg: '#e2e8f0', color: '#475569' },
};

const emptyForm = {
  contractCode: '',
  employeeId: '',
  contractType: 'xac_dinh_thoi_han' as ContractType,
  signDate: new Date().toISOString().split('T')[0],
  effectiveDate: new Date().toISOString().split('T')[0],
  expireDate: '',
  baseSalary: '15000000',
  insuranceSalary: '5000000',
  standardWorkDays: '26',
  annualLeaveDays: '12',
  salaryPercentage: '100',
  position: '',
  workLocation: 'Trụ sở chính VisionHR',
  note: '',
  status: 'hieu_luc' as ContractStatus,
};

export default function Contracts() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'employee';
  const isHRorAdmin = role === 'admin' || role === 'hr';

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Form states
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Renew form state
  const [renewForm, setRenewForm] = useState({
    newContractCode: '',
    newContractType: 'xac_dinh_thoi_han' as ContractType,
    newEffectiveDate: '',
    newExpireDate: '',
    newBaseSalary: '',
    note: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [contractList, contractStats, empList, deptList] = await Promise.all([
        getContracts({
          search: searchTerm || undefined,
          departmentId: selectedDept || undefined,
          type: selectedType || undefined,
          status: selectedStatus || undefined,
        }),
        getContractStats(),
        isHRorAdmin ? getEmployees() : Promise.resolve([]),
        getDepartments(),
      ]);
      setContracts(contractList);
      setStats(contractStats);
      setEmployees(empList);
      setDepartments(deptList);
    } catch (err) {
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept, selectedType, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreateModal = async () => {
    try {
      const { nextCode } = await getNextContractCode('xac_dinh_thoi_han');
      setFormData({
        ...emptyForm,
        contractCode: nextCode,
        signDate: new Date().toISOString().split('T')[0],
        effectiveDate: new Date().toISOString().split('T')[0],
      });
      setFormError('');
      setCreateModalOpen(true);
    } catch {
      setFormData(emptyForm);
      setCreateModalOpen(true);
    }
  };

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find((e) => String(e.id) === empId);
    setFormData((prev) => ({
      ...prev,
      employeeId: empId,
      position: emp?.position || prev.position,
    }));
  };

  const handleTypeChange = async (type: ContractType) => {
    const today = new Date();
    let newExpire = '';
    let newLeave = '12';
    let newSalaryPct = '100';

    if (type === 'thu_viec') {
      const d = new Date(today);
      d.setMonth(d.getMonth() + 2);
      newExpire = d.toISOString().split('T')[0];
      newLeave = '0';
      newSalaryPct = '85';
    } else if (type === 'xac_dinh_thoi_han') {
      const d = new Date(today);
      d.setFullYear(d.getFullYear() + 1);
      newExpire = d.toISOString().split('T')[0];
      newLeave = '12';
      newSalaryPct = '100';
    } else if (type === 'khong_xac_dinh_thoi_han') {
      newExpire = '';
      newLeave = '12';
      newSalaryPct = '100';
    }

    try {
      const { nextCode } = await getNextContractCode(type);
      setFormData((prev) => ({
        ...prev,
        contractType: type,
        contractCode: nextCode,
        expireDate: newExpire,
        annualLeaveDays: newLeave,
        salaryPercentage: newSalaryPct,
      }));
    } catch {
      setFormData((prev) => ({
        ...prev,
        contractType: type,
        expireDate: newExpire,
        annualLeaveDays: newLeave,
        salaryPercentage: newSalaryPct,
      }));
    }
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.contractCode || !formData.employeeId || !formData.signDate || !formData.effectiveDate) {
      setFormError('Vui lòng nhập đầy đủ các trường bắt buộc (*).');
      return;
    }

    setSaving(true);
    try {
      await createContract({
        contractCode: formData.contractCode,
        employeeId: Number(formData.employeeId),
        contractType: formData.contractType,
        signDate: formData.signDate,
        effectiveDate: formData.effectiveDate,
        expireDate: formData.expireDate || null,
        baseSalary: Number(formData.baseSalary) || 0,
        insuranceSalary: Number(formData.insuranceSalary) || 0,
        standardWorkDays: Number(formData.standardWorkDays) || 26,
        annualLeaveDays: Number(formData.annualLeaveDays) || 12,
        salaryPercentage: Number(formData.salaryPercentage) || 100,
        position: formData.position,
        workLocation: formData.workLocation,
        note: formData.note,
        status: formData.status,
      });
      setCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu hợp đồng.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenRenewModal = async (c: Contract) => {
    setSelectedContract(c);
    let nextEffective = '';
    if (c.expireDate) {
      const d = new Date(c.expireDate);
      d.setDate(d.getDate() + 1);
      nextEffective = d.toISOString().split('T')[0];
    } else {
      nextEffective = new Date().toISOString().split('T')[0];
    }

    const nextExpireDate = new Date(nextEffective);
    nextExpireDate.setFullYear(nextExpireDate.getFullYear() + 1);

    try {
      const { nextCode } = await getNextContractCode('xac_dinh_thoi_han');
      setRenewForm({
        newContractCode: nextCode,
        newContractType: 'xac_dinh_thoi_han',
        newEffectiveDate: nextEffective,
        newExpireDate: nextExpireDate.toISOString().split('T')[0],
        newBaseSalary: String(c.baseSalary),
        note: `Gia hạn tiếp nối từ hợp đồng ${c.contractCode}`,
      });
    } catch {
      setRenewForm({
        newContractCode: '',
        newContractType: 'xac_dinh_thoi_han',
        newEffectiveDate: nextEffective,
        newExpireDate: nextExpireDate.toISOString().split('T')[0],
        newBaseSalary: String(c.baseSalary),
        note: '',
      });
    }
    setRenewModalOpen(true);
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    setSaving(true);
    try {
      await renewContract(selectedContract.id, {
        newContractCode: renewForm.newContractCode || undefined,
        newContractType: renewForm.newContractType,
        newEffectiveDate: renewForm.newEffectiveDate,
        newExpireDate: renewForm.newExpireDate,
        newBaseSalary: Number(renewForm.newBaseSalary),
        note: renewForm.note,
      });
      setRenewModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi gia hạn hợp đồng.');
    } finally {
      setSaving(false);
    }
  };

  const handleTerminate = async (c: Contract) => {
    if (window.confirm(`Bạn có chắc chắn muốn chấm dứt / thanh lý hợp đồng ${c.contractCode} của nhân viên ${c.employeeName}?`)) {
      try {
        await terminateContract(c.id, 'Chấm dứt hợp đồng theo quyết định nhân sự');
        loadData();
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Lỗi khi chấm dứt hợp đồng.');
      }
    }
  };


  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 4,
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. HEADER CARD */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '20px 24px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>
              Quản Lý Hợp Đồng Lao Động
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0 0' }}>
              Quy chuẩn 26 công chuẩn, quỹ 12 ngày phép và cảnh báo gia hạn tự động
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={loadData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              color: '#4b5563',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>

          {isHRorAdmin && (
            <Button onClick={handleOpenCreateModal}>
              <Plus size={16} style={{ marginRight: 6 }} />
              Soạn Thảo Hợp Đồng
            </Button>
          )}
        </div>
      </div>

      {/* 2. THẺ THỐNG KÊ KPI GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {/* Card 1: Tổng số */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '18px 20px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
              Tổng Hợp Đồng
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginTop: 4 }}>
              {stats?.total || 0}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Hồ sơ nhân sự</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCheck2 size={22} />
          </div>
        </div>

        {/* Card 2: Đang hiệu lực */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '18px 20px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
              Đang Hiệu Lực
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#15803d', marginTop: 4 }}>
              {stats?.active || 0}
            </div>
            <div style={{ fontSize: 12, color: '#86efac', marginTop: 2 }}>Đang làm việc</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Card 3: CẢNH BÁO SẮP HẾT HẠN (MÀU VÀNG/CAM NỔI BẬT) */}
        <div
          style={{
            background: '#fffbeb',
            borderRadius: 12,
            padding: '18px 20px',
            border: '1.5px solid #fde68a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
              Sắp Hết Hạn (≤ 30 ngày)
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#92400e', marginTop: 4 }}>
              {stats?.expiringSoon || 0}
            </div>
            <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Cần xem xét gia hạn</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* Card 4: Đã hết hạn / Thanh lý */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '18px 20px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
              Đã Hết Hạn / Thanh Lý
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#4b5563', marginTop: 4 }}>
              {(Number(stats?.expired) || 0) + (Number(stats?.terminated) || 0)}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Đã kết thúc</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f3f4f6', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* 3. BỘ LỌC VÀ TÌM KIẾM */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '16px 20px',
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Tìm theo Tên nhân viên, Mã NV, Số HĐ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...inputStyle,
              paddingLeft: 36,
              background: '#f9fafb',
            }}
          />
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, color: '#374151', background: '#f9fafb' }}
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, color: '#374151', background: '#f9fafb' }}
          >
            <option value="">Tất cả loại HĐ</option>
            <option value="thu_viec">HĐ Thử việc</option>
            <option value="xac_dinh_thoi_han">Xác định thời hạn</option>
            <option value="khong_xac_dinh_thoi_han">Không xác định thời hạn</option>
            <option value="thoi_vu">Thời vụ / CTV</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, color: '#374151', background: '#f9fafb' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="hieu_luc">Đang hiệu lực</option>
            <option value="sap_het_han">Sắp hết hạn (≤ 30 ngày)</option>
            <option value="het_han">Đã hết hạn</option>
            <option value="da_cham_dut">Đã thanh lý</option>
          </select>
        </div>
      </div>

      {/* 4. BẢNG DANH SÁCH HỢP ĐỒNG */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontWeight: 600 }}>
                <th style={{ padding: '12px 16px' }}>Số Hợp Đồng</th>
                <th style={{ padding: '12px 16px' }}>Nhân Viên</th>
                <th style={{ padding: '12px 16px' }}>Loại Hợp Đồng</th>
                <th style={{ padding: '12px 16px' }}>Thời Hạn</th>
                <th style={{ padding: '12px 16px' }}>Lương Thỏa Thuận</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Công Chuẩn / Phép</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Trạng Thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                    Chưa có hợp đồng nào phù hợp.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => {
                  const typeMeta = CONTRACT_TYPE_MAP[c.contractType] || {
                    label: c.contractType,
                    bg: '#f3f4f6',
                    color: '#374151',
                    border: '#e5e7eb',
                  };
                  const statusMeta = CONTRACT_STATUS_MAP[c.status] || {
                    label: c.status,
                    bg: '#f3f4f6',
                    color: '#374151',
                  };
                  const isExpiring = c.daysRemaining !== null && c.daysRemaining !== undefined && c.daysRemaining >= 0 && c.daysRemaining <= 30 && c.status !== 'da_cham_dut';

                  return (
                    <tr
                      key={c.id}
                      style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Số HĐ */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace', fontSize: 13 }}>
                          {c.contractCode}
                        </span>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Ký: {c.signDate}</div>
                      </td>

                      {/* Nhân viên */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{c.employeeName}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>{c.employeeCode}</span> • {c.departmentName || 'Chưa phân phòng'}
                        </div>
                      </td>

                      {/* Loại HĐ */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            background: typeMeta.bg,
                            color: typeMeta.color,
                            border: `1px solid ${typeMeta.border}`,
                          }}
                        >
                          {typeMeta.label}
                        </span>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{c.position || 'Nhân viên'}</div>
                      </td>

                      {/* Thời hạn */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 12, color: '#374151' }}>
                          <span style={{ color: '#9ca3af' }}>Từ:</span> {c.effectiveDate}
                        </div>
                        <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>
                          <span style={{ color: '#9ca3af' }}>Đến:</span> {c.expireDate || 'Vô thời hạn'}
                        </div>
                        {isExpiring && (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#b45309',
                              background: '#fef3c7',
                              padding: '2px 6px',
                              borderRadius: 4,
                              marginTop: 4,
                            }}
                          >
                            <Clock size={11} /> Còn {c.daysRemaining} ngày
                          </div>
                        )}
                      </td>

                      {/* Lương */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>
                          {formatVND(c.baseSalary)}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                          Hưởng: <strong style={{ color: '#2563eb' }}>{c.salaryPercentage}%</strong> | Đóng BH: {formatVND(c.insuranceSalary)}
                        </div>
                      </td>

                      {/* Công chuẩn & phép */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'inline-block',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#1e3a8a',
                            background: '#dbeafe',
                            padding: '2px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {c.standardWorkDays} công/tháng
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                          {c.annualLeaveDays} ngày phép/năm
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isExpiring ? '#fef3c7' : statusMeta.bg,
                            color: isExpiring ? '#92400e' : statusMeta.color,
                            border: isExpiring ? '1px solid #fde68a' : 'none',
                          }}
                        >
                          {isExpiring ? 'Sắp hết hạn' : statusMeta.label}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            title="Xem chi tiết & In văn bản"
                            onClick={() => {
                              setSelectedContract(c);
                              setDetailModalOpen(true);
                            }}
                            style={{
                              border: '1px solid #d1d5db',
                              background: '#ffffff',
                              borderRadius: 6,
                              padding: '5px 8px',
                              cursor: 'pointer',
                              color: '#2563eb',
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          {isHRorAdmin && c.status !== 'da_cham_dut' && (
                            <button
                              title="Gia hạn hợp đồng"
                              onClick={() => handleOpenRenewModal(c)}
                              style={{
                                border: '1px solid #a7f3d0',
                                background: '#ecfdf5',
                                borderRadius: 6,
                                padding: '5px 8px',
                                cursor: 'pointer',
                                color: '#047857',
                              }}
                            >
                              <RefreshCw size={15} />
                            </button>
                          )}

                          {isHRorAdmin && c.status !== 'da_cham_dut' && (
                            <button
                              title="Thanh lý hợp đồng"
                              onClick={() => handleTerminate(c)}
                              style={{
                                border: '1px solid #fecaca',
                                background: '#fef2f2',
                                borderRadius: 6,
                                padding: '5px 8px',
                                cursor: 'pointer',
                                color: '#dc2626',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL SOẠN THẢO HỢP ĐỒNG MỚI */}
      <ContractFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleSaveContract}
        formData={formData}
        setFormData={setFormData}
        employees={employees}
        saving={saving}
        formError={formError}
        onEmployeeSelect={handleEmployeeSelect}
        onTypeChange={handleTypeChange}
      />

      {/* 6. MODAL GIA HẠN HỢP ĐỒNG */}
      <ContractRenewModal
        open={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        onSubmit={handleRenewSubmit}
        contract={selectedContract}
        renewForm={renewForm}
        setRenewForm={setRenewForm}
        saving={saving}
      />

      {/* 7. MODAL XEM CHI TIẾT & IN VĂN BẢN HỢP ĐỒNG */}
      <ContractDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        contract={selectedContract}
        typeMap={CONTRACT_TYPE_MAP}
      />
    </div>
  );
}
