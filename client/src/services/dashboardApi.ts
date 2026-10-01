import axiosClient from '../utils/axiosClient';

export interface DashboardOverview {
  totalEmployees: number;
  workingToday: number;
  absentToday: number;
  lateToday: number;
  attendanceTrend: any[];
  departmentBreakdown: any[];
}

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const { data } = await axiosClient.get('/reports/dashboard-overview');
  return data;
};
