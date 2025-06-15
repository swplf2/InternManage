import apiClient from './api';
import { Evaluation } from '../types';

export interface EvaluationStatistics {
  overview: {
    totalEvaluations: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    averageAccuracy: number;
    averageGrammar: number;
    averageStyle: number;
    averageTerminology: number;
    averageFormatting: number;
    averageAdherence: number;
  };
  scoreDistribution: Array<{
    _id: string;
    count: number;
  }>;
  criteriaAnalysis: Array<{
    accuracy: number;
    grammar: number;
    style: number;
    terminology: number;
    formatting: number;
    adherence: number;
  }>;
}

export interface CreateEvaluationData {
  taskId: string;
  internId: string;
  criteria: {
    accuracy: { score: number; comments?: string };
    grammar: { score: number; comments?: string };
    style: { score: number; comments?: string };
    terminology: { score: number; comments?: string };
    formatting: { score: number; comments?: string };
    adherence: { score: number; comments?: string };
  };
  overallComments?: string;
  recommendations?: string;
}

export interface EvaluationsResponse {
  evaluations: Evaluation[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export const evaluationService = {
  async getEvaluations(params?: {
    page?: number;
    limit?: number;
    intern?: string;
    taskId?: string;
  }): Promise<EvaluationsResponse> {
    const response = await apiClient.get('/evaluations', { params });
    return response.data;
  },

  async getEvaluationById(id: string): Promise<Evaluation> {
    const response = await apiClient.get(`/evaluations/${id}`);
    return response.data;
  },

  async createEvaluation(evaluationData: CreateEvaluationData): Promise<Evaluation> {
    const response = await apiClient.post('/evaluations', evaluationData);
    return response.data;
  },

  async updateEvaluation(id: string, updates: Partial<CreateEvaluationData>): Promise<Evaluation> {
    const response = await apiClient.put(`/evaluations/${id}`, updates);
    return response.data;
  },

  async deleteEvaluation(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/evaluations/${id}`);
    return response.data;
  },

  async getStatistics(params?: {
    intern?: string;
    period?: 'week' | 'month' | 'quarter' | 'year';
  }): Promise<EvaluationStatistics> {
    const response = await apiClient.get('/evaluations/statistics', { params });
    return response.data;
  },
};
