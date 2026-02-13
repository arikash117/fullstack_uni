export interface AuthUser {
  role: 'admin' | 'trainer' | 'trainee';
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; role: string | null }>;
  logout: () => void;
}