import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * Redirects authenticated users away from guest-only pages (login, register).
 */
export default function GuestRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/articles" replace />;
  }

  return <Outlet />;
}
