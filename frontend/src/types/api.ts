export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'trainer' | 'trainee';
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}
