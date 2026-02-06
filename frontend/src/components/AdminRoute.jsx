import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Проверка прав...</div>;
  }

  if (!user?.role || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}