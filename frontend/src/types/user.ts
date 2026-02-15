export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  trainee_count: number;
}

export interface UserSummary {
  id: number;
  username: string;
  role: 'admin' | 'user';
}