import axiosClient from '../utils/axiosClient';

export interface ScheduleItem {
  id: number;
  employeeId: number;
  shiftId: number;
  date: string; // YYYY-MM-DD
  note?: string;
  status: string;
  employeeName: string;
  employeeCode: string;
  position?: string;
  departmentId?: number;
  department?: string;
  shiftName: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  attendanceId?: number;
  checkInTime?: string;
  checkOutTime?: string;
  attendanceStatus?: 'dung_gio' | 'di_muon' | 'vang_mat' | string;
  leaveType?: string;
}

export interface MyScheduleResponse {
  employee: {
    id: number;
    code: string;
    name: string;
    position?: string;
    department?: string;
  };
  schedules: ScheduleItem[];
}

export const getMySchedule = async (params?: { startDate?: string; endDate?: string }): Promise<MyScheduleResponse> => {
  const { data } = await axiosClient.get('/schedules/my', { params });
  return data;
};

export const getSchedules = async (params?: {
  departmentId?: number | string;
  employeeId?: number | string;
  startDate?: string;
  endDate?: string;
}): Promise<ScheduleItem[]> => {
  const { data } = await axiosClient.get('/schedules', { params });
  return data;
};

export const assignSchedule = async (payload: {
  employeeId: number;
  shiftId: number;
  date: string;
  note?: string;
}): Promise<{ success: boolean; message: string }> => {
  const { data } = await axiosClient.post('/schedules/assign', payload);
  return data;
};

export const bulkAssignSchedule = async (payload: {
  employeeIds: number[];
  shiftId: number;
  startDate: string;
  endDate: string;
  note?: string;
}): Promise<{ success: boolean; message: string }> => {
  const { data } = await axiosClient.post('/schedules/bulk-assign', payload);
  return data;
};

export const deleteSchedule = async (id: number): Promise<{ success: boolean; message: string }> => {
  const { data } = await axiosClient.delete(`/schedules/${id}`);
  return data;
};
