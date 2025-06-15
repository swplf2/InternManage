import apiClient from './api';
import { Task, User } from '../types';

export interface TaskStatistics {
  overview: {
    total: number;
    completed: number;
    inProgress: number;
    submitted: number;
    overdue: number;
  };
  statusDistribution: Array<{
    _id: string;
    count: number;
  }>;
  priorityDistribution: Array<{
    _id: string;
    count: number;
  }>;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  type: 'translation' | 'review' | 'proofreading';
  assignedTo: string;
  sourceLanguage: string;
  targetLanguage: string;
  specializedField?: string;
  instructions?: string;
  deadline: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration?: number;
  wordCount?: number;
}

export interface TasksResponse {
  tasks: Task[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export const taskService = {
  async getTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assignedTo?: string;
  }): Promise<TasksResponse> {
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  },

  async getTaskById(id: string): Promise<Task> {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },
  async createTask(taskData: CreateTaskData | FormData): Promise<Task> {
    const response = await apiClient.post('/tasks', taskData, {
      headers: taskData instanceof FormData ? {
        'Content-Type': 'multipart/form-data',
      } : undefined
    });
    return response.data;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const response = await apiClient.put(`/tasks/${id}`, updates);
    return response.data;
  },

  async deleteTask(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },
  async submitTask(id: string, data?: { translatedDocument?: any }): Promise<Task> {
    const response = await apiClient.post(`/tasks/${id}/submit`, data);
    return response.data;
  },

  async saveProgress(id: string, progressData: {
    sentences: any[];
    progress: number;
    workNotes: string;
  }): Promise<{ message: string; task: Task }> {
    const response = await apiClient.put(`/tasks/${id}/progress`, progressData);
    return response.data;
  },

  async getStatistics(): Promise<TaskStatistics> {
    const response = await apiClient.get('/tasks/statistics');
    return response.data;
  },
};
