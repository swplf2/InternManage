import apiClient from './api';

export interface DocumentInfo {
  filename: string;
  originalName?: string;
  size: number;
  mimetype?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface UploadResponse {
  message: string;
  file: DocumentInfo;
}

export interface UploadMultipleResponse {
  message: string;
  files: DocumentInfo[];
}

export const documentService = {
  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('document', file);

    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async uploadMultipleDocuments(files: File[]): Promise<UploadMultipleResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });

    const response = await apiClient.post('/documents/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async downloadDocument(filename: string): Promise<Blob> {
    const response = await apiClient.get(`/documents/download/${filename}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async getDocumentInfo(filename: string): Promise<DocumentInfo> {
    const response = await apiClient.get(`/documents/${filename}/info`);
    return response.data;
  },

  async deleteDocument(filename: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/documents/${filename}`);
    return response.data;
  },

  async listDocuments(): Promise<{ documents: DocumentInfo[] }> {
    const response = await apiClient.get('/documents');
    return response.data;
  },

  getDownloadUrl(filename: string): string {
    return `/api/documents/download/${filename}`;
  },
};
