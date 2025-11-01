import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export function SessionRoute() {
  const { session } = useAuth();
  if (!session) return <Navigate to="/" replace />;
  return <Outlet />;
}
