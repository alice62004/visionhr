import axiosClient from '../utils/axiosClient';
import { Employee, Department } from '../types';

export const getEmployees = async (): Promise<Employee[]> => {
  const { data } = await axiosClient.get('/employees');
  return data;
};

export const getEmployeeById = async (id: string | number): Promise<Employee> => {
  const { data } = await axiosClient.get(`/employees/${id}`);
  return data;
};

export const createEmployee = async (payload: Partial<Employee>): Promise<Employee> => {
  const { data } = await axiosClient.post('/employees', payload);
  return data;
};

export const updateEmployee = async (id: string | number, payload: Partial<Employee>): Promise<Employee> => {
  const { data } = await axiosClient.put(`/employees/${id}`, payload);
  return data;
};

export const deleteEmployee = async (id: string | number): Promise<{ message: string }> => {
  const { data } = await axiosClient.delete(`/employees/${id}`);
  return data;
};

export const enrollFace = async ({
  employeeId,
  imageBase64,
}: {
  employeeId?: number | string;
  imageBase64: string;
}): Promise<{ message: string; faceData?: any }> => {
  const url = employeeId ? `/employees/${employeeId}/face-enrollment` : '/employees/face-enrollment';
  const { data } = await axiosClient.post(url, { employeeId, imageBase64 });
  return data;
};

export const deleteFaceEnrollment = async (employeeId: number | string): Promise<{ message: string }> => {
  const { data } = await axiosClient.delete(`/employees/${employeeId}/face-enrollment`);
  return data;
};


export const getUnlinkedAccounts = async (currentEmployeeId?: number | string): Promise<{ id: number; name: string; email: string; role: string; employeeId?: number }[]> => {
  const url = currentEmployeeId ? `/employees/unlinked-accounts?currentEmployeeId=${currentEmployeeId}` : '/employees/unlinked-accounts';
  const { data } = await axiosClient.get(url);
  return data;
};

export const getDepartments = async (): Promise<Department[]> => {
  const { data } = await axiosClient.get('/departments');
  return data;
};

export const createDepartment = async (payload: { name: string; managerId?: number | null }): Promise<Department> => {
  const { data } = await axiosClient.post('/departments', payload);
  return data;
};

export const updateDepartment = async (id: string | number, payload: { name: string; managerId?: number | null }): Promise<Department> => {
  const { data } = await axiosClient.put(`/departments/${id}`, payload);
  return data;
};

export const getDepartmentEmployees = async (departmentId: number | string): Promise<Employee[]> => {
  const { data } = await axiosClient.get(`/departments/${departmentId}/employees`);
  return data;
};

export const deleteDepartment = async (id: string | number): Promise<{ message: string }> => {
  const { data } = await axiosClient.delete(`/departments/${id}`);
  return data;
};
