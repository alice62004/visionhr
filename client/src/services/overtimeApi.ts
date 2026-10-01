import axiosClient from '../utils/axiosClient';
import { OvertimeRequest } from '../types';

export const getOvertimeRequests = async (): Promise<OvertimeRequest[]> => {
  const { data } = await axiosClient.get('/overtime');
  return data;
};

export const createOvertimeRequest = async (payload: Partial<OvertimeRequest>): Promise<{ id: number }> => {
  const { data } = await axiosClient.post('/overtime', payload);
  return data;
};

export const approveOvertimeRequest = async (id: string | number): Promise<{ message: string }> => {
  const { data } = await axiosClient.patch(`/overtime/${id}/approve`);
  return data;
};

export const rejectOvertimeRequest = async (id: string | number, reason?: string): Promise<{ message: string }> => {
  const { data } = await axiosClient.patch(`/overtime/${id}/reject`, { reason });
  return data;
};
