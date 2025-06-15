import apiClient from './api';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'intern';
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  async register(userData: RegisterData): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('token');
  },
};
