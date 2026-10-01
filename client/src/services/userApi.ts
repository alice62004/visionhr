import axiosClient from '../utils/axiosClient';
import { User, Employee } from '../types';

export const getUsers = async (): Promise<User[]> => {
  const { data } = await axiosClient.get('/users');
  return data;
};

export const getAvailableEmployees = async (excludeUserId?: number): Promise<Employee[]> => {
  const url = excludeUserId ? `/users/available-employees?excludeUserId=${excludeUserId}` : '/users/available-employees';
  const { data } = await axiosClient.get(url);
  return data;
};

export const getUserById = async (id: number | string): Promise<User> => {
  const { data } = await axiosClient.get(`/users/${id}`);
  return data;
};

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  role: string;
  employeeId?: number | null;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  employeeId?: number | null;
}

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  const { data } = await axiosClient.post('/users', payload);
  return data;
};

export const updateUser = async (id: number | string, payload: UpdateUserPayload): Promise<User> => {
  const { data } = await axiosClient.put(`/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id: number | string): Promise<{ message: string }> => {
  const { data } = await axiosClient.delete(`/users/${id}`);
  return data;
};
