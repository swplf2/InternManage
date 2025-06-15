import apiClient from './api';
import { User } from '../types';

export interface UsersResponse {
  users: User[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'intern';
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  profile?: {
    phone?: string;
    languagePairs?: Array<{ source: string; target: string }>;
    specializedFields?: string[];
    experience?: 'beginner' | 'intermediate' | 'advanced';
    bio?: string;
  };
  role?: 'admin' | 'intern';
  isActive?: boolean;
}

export const userService = {
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<UsersResponse> {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  async getInterns(): Promise<{ interns: User[] }> {
    const response = await apiClient.get('/users/interns');
    return response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  async createUser(userData: CreateUserData): Promise<User> {
    const response = await apiClient.post('/auth/register', userData);
    return response.data.user;
  },

  async updateUser(id: string, updates: UpdateUserData): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, updates);
    return response.data;
  },

  async updateProfile(updates: UpdateUserData): Promise<User> {
    const response = await apiClient.put('/users/profile', updates);
    return response.data;
  },
  async deleteUser(id: string): Promise<{ message: string; deletedTasks?: number }> {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.put('/users/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  async getUserStatistics(id: string): Promise<{
    statistics: User['statistics'];
    user: { firstName: string; lastName: string };
  }> {
    const response = await apiClient.get(`/users/${id}/statistics`);
    return response.data;
  },
};
