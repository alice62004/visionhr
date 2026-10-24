export type EmployeeStatus = 'dang_lam_viec' | 'da_nghi_viec';

export interface Employee {
  id: number;
  code: string;
  name: string;
  email: string;
  phone?: string;
  department_id?: number | null;
  department?: string;
  position?: string;
  status: EmployeeStatus;
  joinDate?: string;
  education?: string;
  major?: string;
  dob?: string;
  gender?: 'nam' | 'nu' | 'khac';
  idCard?: string;
  address?: string;
  hasFace?: boolean | number;
  faceData?: any;
  face_data?: any;
  accountId?: number | null;
  accountEmail?: string | null;
  accountRole?: UserRole | null;
  cv?: {
    name: string;
    size?: number;
    type?: string;
    data?: string;
    url?: string;
    uploadedAt?: string;
  } | null;
  emailDelivery?: {
    success: boolean;
    message?: string;
  };
}

export interface Department {
  id: number;
  name: string;
  manager?: string;
  managerId?: number | null;
  manager_id?: number | null;
  headcount?: number;
  positionCount?: number;
  faceEnrolledCount?: number;
  facePendingCount?: number;
  positions?: string;
}

export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  departmentId?: number | null;
  department?: string;
}

export type AttendanceStatus = 'dung_gio' | 'di_muon' | 'vang_mat';
export type AttendanceMethod = 'nhan_dien_khuon_mat' | 'thu_cong';

export interface AttendanceRecord {
  id: number;
  employeeId?: number;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  position?: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: AttendanceStatus;
  method: AttendanceMethod;
  shiftName?: string;
  avatar?: string | null;
  snapshotImage?: string | null;
  inImage?: string | null;
  outImage?: string | null;
  hasRealSnapshot?: boolean;
}

export type LeaveStatus = 'cho_duyet' | 'da_duyet' | 'tu_choi';

export interface LeaveRequest {
  id: number;
  employeeName?: string;
  type: string;
  fromDate: string;
  toDate: string;
  reason?: string;
  status: LeaveStatus;
  reject_reason?: string | null;
}

export type OvertimeStatus = 'cho_duyet' | 'da_duyet' | 'tu_choi';

export interface OvertimeRequest {
  id: number;
  employeeId?: number;
  employeeCode?: string;
  employeeName?: string;
  date: string;
  hours: number;
  reason?: string;
  status: OvertimeStatus;
  reject_reason?: string | null;
}

export interface PayrollRecord {
  id: number;
  employeeId?: number;
  employeeName: string;
  month: string;
  baseSalary: number;
  otPay: number;
  netSalary: number;
}

export type UserRole = 'admin' | 'hr' | 'manager' | 'employee';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: number | null;
  createdAt?: string;
  employeeCode?: string;
  employeeName?: string;
  employeePosition?: string;
  employeeStatus?: EmployeeStatus;
  hasFace?: boolean | number;
  departmentId?: number | null;
  departmentName?: string | null;
}
