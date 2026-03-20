
import { apiFetch } from './api';

export interface MediaItem {
  id: string;
  url: string;
  thumbnail: string;
  name: string;
  type: string;
  size: number;
  dimensions?: string;
  created_at: string;
}

export interface MediaResponse {
  media: MediaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const mediaService = {
  getMedia: async (params?: { page?: number; limit?: number; search?: string; dateFilter?: string }): Promise<MediaResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.dateFilter) query.append('dateFilter', params.dateFilter);
    
    return apiFetch(`/api/media?${query.toString()}`);
  },

  uploadMedia: async (file: File): Promise<MediaItem> => {
    // In a real app, we'd upload the file to a server or S3.
    // For this mock, we'll create a local URL and send metadata to our mock API.
    const url = URL.createObjectURL(file);
    
    const newMedia = {
      url: url,
      thumbnail: url, // Using same URL for thumbnail in mock
      name: file.name,
      type: file.type,
      size: file.size,
      dimensions: 'Unknown', // Ideally we'd calculate this
    };

    return apiFetch('/api/media', {
      method: 'POST',
      body: JSON.stringify(newMedia)
    });
  },

  deleteMedia: async (id: string): Promise<void> => {
    return apiFetch(`/api/media/${id}`, {
      method: 'DELETE'
    });
  },

  updateMedia: async (id: string, data: Partial<MediaItem>): Promise<MediaItem> => {
    return apiFetch(`/api/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};
