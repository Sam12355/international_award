import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { UserRole } from '../../types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
}

export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/articles" replace />;
  }

  return <Outlet />;
}
