import axiosClient from '../utils/axiosClient';

export type ContractType = 'thu_viec' | 'xac_dinh_thoi_han' | 'khong_xac_dinh_thoi_han' | 'thoi_vu';
export type ContractStatus = 'hieu_luc' | 'sap_het_han' | 'het_han' | 'da_cham_dut';

export interface Contract {
  id: number;
  contractCode: string;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  employeeEmail: string;
  employeePhone?: string;
  employeeIdCard?: string;
  employeeAddress?: string;
  departmentId?: number;
  departmentName?: string;
  contractType: ContractType;
  signDate: string;
  effectiveDate: string;
  expireDate?: string | null;
  baseSalary: number;
  insuranceSalary: number;
  standardWorkDays: number;
  annualLeaveDays: number;
  salaryPercentage: number;
  position?: string;
  workLocation?: string;
  note?: string;
  status: ContractStatus;
  createdAt: string;
  daysRemaining?: number | null;
}

export interface ContractStats {
  total: number;
  active: number | string;
  expiringSoon: number | string;
  expired: number | string;
  terminated: number | string;
}

export interface ContractFilter {
  departmentId?: string | number;
  status?: string;
  type?: string;
  search?: string;
}

// Lấy danh sách hợp đồng
export const getContracts = async (params?: ContractFilter): Promise<Contract[]> => {
  const { data } = await axiosClient.get('/contracts', { params });
  return data;
};

// Lấy thống kê hợp đồng
export const getContractStats = async (): Promise<ContractStats> => {
  const { data } = await axiosClient.get('/contracts/stats');
  return data;
};

// Lấy chi tiết hợp đồng
export const getContractById = async (id: number | string): Promise<Contract> => {
  const { data } = await axiosClient.get(`/contracts/${id}`);
  return data;
};

// Lấy mã hợp đồng gợi ý tiếp theo
export const getNextContractCode = async (type?: string): Promise<{ nextCode: string }> => {
  const { data } = await axiosClient.get('/contracts/next-code', { params: { type } });
  return data;
};

// Tạo mới hợp đồng
export const createContract = async (payload: Partial<Contract>): Promise<{ id: number; message: string }> => {
  const { data } = await axiosClient.post('/contracts', payload);
  return data;
};

// Cập nhật hợp đồng
export const updateContract = async (id: number | string, payload: Partial<Contract>): Promise<{ message: string }> => {
  const { data } = await axiosClient.put(`/contracts/${id}`, payload);
  return data;
};

// Gia hạn hợp đồng
export const renewContract = async (
  id: number | string,
  payload: {
    newContractCode?: string;
    newContractType?: ContractType;
    newEffectiveDate?: string;
    newExpireDate?: string;
    newBaseSalary?: number;
    newInsuranceSalary?: number;
    note?: string;
  }
): Promise<{ id: number; newContractCode: string; message: string }> => {
  const { data } = await axiosClient.post(`/contracts/${id}/renew`, payload);
  return data;
};

// Chấm dứt / thanh lý hợp đồng
export const terminateContract = async (id: number | string, note?: string): Promise<{ message: string }> => {
  const { data } = await axiosClient.patch(`/contracts/${id}/terminate`, { note });
  return data;
};
