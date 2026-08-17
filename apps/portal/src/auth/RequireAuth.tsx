import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // brief — resuming a session from the refresh token
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}
