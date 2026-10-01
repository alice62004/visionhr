import axiosClient from '../utils/axiosClient';
import { User } from '../types';

export const login = async ({ email, password }: { email: string; password: string }): Promise<{ user: User; token: string }> => {
  const { data } = await axiosClient.post('/auth/login', { email, password });
  return data;
};

export const getAuditLogs = async (): Promise<any[]> => {
  const { data } = await axiosClient.get('/audit-log');
  return data;
};
