import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { getDashboardPathForRole } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const authPath = `/auth?next=${encodeURIComponent(location.pathname)}`;
    console.log('[RouteGuard] No authenticated user, redirecting to auth', {
      path: location.pathname,
      authPath,
    });
    return <Navigate to={authPath} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const redirectPath = getDashboardPathForRole(user.role);
    console.log('[RouteGuard] Role mismatch, redirecting to role dashboard', {
      path: location.pathname,
      currentRole: user.role,
      allowedRoles,
      redirectPath,
    });
    return <Navigate to={redirectPath} replace />;
  }

  console.log('[RouteGuard] Access granted', {
    path: location.pathname,
    role: user.role,
  });
  return <>{children}</>;
};
