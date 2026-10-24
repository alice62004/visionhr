import axiosClient from '../utils/axiosClient';

export interface EmployeeKpiItem {
  id: number;
  code: string;
  name: string;
  position: string;
  department: string;
  departmentId?: number;
  avatar?: string | null;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  taskCompletionRate: number;
  workingDays: number;
  onTimeDays: number;
  lateDays: number;
  punctualityScore: number;
  totalOtHours: number;
  overallKpi: number;
  grade: 'A' | 'B' | 'C' | 'D';
  gradeLabel: string;
  gradeColor: string;
}

export interface KpiOverviewData {
  month: string;
  totalEmployees: number;
  avgKpi: number;
  avgTaskCompletion: number;
  gradeCounts: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  employeeKpis: EmployeeKpiItem[];
}

export const getKpiOverview = async (params?: { month?: string; departmentId?: string | number }): Promise<KpiOverviewData> => {
  const query = new URLSearchParams();
  if (params?.month) query.append('month', params.month);
  if (params?.departmentId) query.append('departmentId', String(params.departmentId));
  const queryString = query.toString() ? `?${query.toString()}` : '';

  const { data } = await axiosClient.get(`/reports/kpi-overview${queryString}`);
  return data;
};
