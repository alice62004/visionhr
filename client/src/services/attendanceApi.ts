import axiosClient from '../utils/axiosClient';
import { AttendanceRecord, Shift } from '../types';

export const getShifts = async (): Promise<Shift[]> => {
  const { data } = await axiosClient.get('/shifts');
  return data;
};

export const createShift = async (payload: Partial<Shift>): Promise<Shift> => {
  const { data } = await axiosClient.post('/shifts', payload);
  return data;
};

export const updateShift = async (id: string | number, payload: Partial<Shift>): Promise<Shift> => {
  const { data } = await axiosClient.put(`/shifts/${id}`, payload);
  return data;
};

export const deleteShift = async (id: string | number): Promise<{ message: string }> => {
  const { data } = await axiosClient.delete(`/shifts/${id}`);
  return data;
};

export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  const { data } = await axiosClient.get('/attendance');
  return data;
};

export const getAttendanceById = async (id: string | number): Promise<AttendanceRecord> => {
  const { data } = await axiosClient.get(`/attendance/${id}`);
  return data;
};

export const checkInWithFace = async (payload: {
  imageBase64: string;
  actionType?: 'auto' | 'check_in' | 'check_out';
  shiftMode?: 'auto' | 'morning_in' | 'morning_out' | 'afternoon_in' | 'afternoon_out';
}): Promise<any> => {
  const { data } = await axiosClient.post('/attendance/face-checkin', payload);
  return data;
};
