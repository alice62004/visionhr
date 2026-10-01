import axiosClient from '../utils/axiosClient';
import { PayrollRecord } from '../types';

export const getPayrolls = async (month?: string): Promise<PayrollRecord[]> => {
  const { data } = await axiosClient.get('/payroll', { params: { month } });
  return data;
};
