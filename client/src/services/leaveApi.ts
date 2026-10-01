import axiosClient from '../utils/axiosClient';
import { LeaveRequest } from '../types';

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const { data } = await axiosClient.get('/leave');
  return data;
};

export const createLeaveRequest = async (payload: Partial<LeaveRequest>): Promise<{ id: number }> => {
  const { data } = await axiosClient.post('/leave', payload);
  return data;
};

export const approveLeaveRequest = async (id: string | number): Promise<{ message: string }> => {
  const { data } = await axiosClient.patch(`/leave/${id}/approve`);
  return data;
};

export const rejectLeaveRequest = async (id: string | number, reason?: string): Promise<{ message: string }> => {
  const { data } = await axiosClient.patch(`/leave/${id}/reject`, { reason });
  return data;
};
