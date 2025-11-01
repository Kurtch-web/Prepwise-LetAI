import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export function ProtectedRoute({ role }: { role: 'admin' | 'user' }) {
  const { session } = useAuth();
  if (!session || session.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
