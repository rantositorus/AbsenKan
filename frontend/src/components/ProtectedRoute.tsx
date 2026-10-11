import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function ProtectedRoute({
  role,
  children,
}: {
  role?: 'employee' | 'hr_admin';
  children?: ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'hr_admin' ? '/admin' : '/'} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}