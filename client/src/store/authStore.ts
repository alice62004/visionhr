import { create } from 'zustand';
import { User } from '../types';

export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const savedUser: User | null = JSON.parse(localStorage.getItem('visionhr_user') || 'null');
const savedToken: string | null = localStorage.getItem('visionhr_token') || null;

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser,
  token: savedToken,
  isAuthenticated: !!savedToken,

  login: (user: User, token: string) => {
    localStorage.setItem('visionhr_user', JSON.stringify(user));
    localStorage.setItem('visionhr_token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('visionhr_user');
    localStorage.removeItem('visionhr_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
