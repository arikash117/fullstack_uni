import api from './client';

const adminAPI = {
  getUsers: async (params = {}) => {
    const { username, role, skip = 0, limit = 10 } = params;
    const response = await api.get('/admin/users', {
      params: { username, role, skip, limit }
    });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

};

export default adminAPI;
