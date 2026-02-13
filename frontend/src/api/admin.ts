import api from './client';
import { User, PaginatedResponse } from '../types/api';

const adminAPI = {
  getUsers: async (
    params: {
      username?: string;
      role?: 'admin' | 'trainer' | 'trainee';
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<User>> => {
    const { username, role, skip = 0, limit = 10 } = params;
    const response = await api.get<PaginatedResponse<User>>('/admin/users', {
      params: { username, role, skip, limit }
    });
    return response.data;
  },

  getUserById: async (userId: number): Promise<User> => {
    const response = await api.get<User>(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserRole: async (userId: number, role: 'admin' | 'trainer' | 'trainee'): Promise<User> => {
    const response = await api.patch<User>(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },
};

export default adminAPI;
