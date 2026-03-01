export const getAuthToken = (): string | null => 
  localStorage.getItem('access_token');

export const getRefreshToken = (): string | null => 
  localStorage.getItem('refresh_token');

export const getUserId = (): number | null => {
  const id = localStorage.getItem('user_id');
  return id ? parseInt(id, 10) : null;
};

export const getUserRole = (): string | null => 
  localStorage.getItem('user_role');

export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_role');
};