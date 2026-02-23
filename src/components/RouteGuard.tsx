import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Shield, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  routeType: 'admin' | 'agent';
}

/**
 * TEMPORARY Route Guard Component
 * 
 * This is a frontend-only access control mechanism for admin/agent routes.
 * 
 * TODO: Replace in Phase 2 with real backend RBAC (Role-Based Access Control)
 * 
 * Current behavior:
 * - Checks if user has the correct role
 * - Allows temporary access via ?access=admin or ?access=agent URL param
 * - Stores temporary access in sessionStorage
 * - Shows access denied page if unauthorized
 */
const TEMP_ACCESS_KEY = 'farmsquare_temp_access';

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, allowedRoles, routeType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for temporary access via URL param (TEMPORARY - for Phase 1 only)
    const accessParam = searchParams.get('access');
    if (accessParam === routeType) {
      sessionStorage.setItem(`${TEMP_ACCESS_KEY}_${routeType}`, 'true');
      // Remove access param from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('access');
      const newUrl = location.pathname + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    }

    // Check access
    const checkAccess = () => {
      // If user has correct role, allow access
      if (user && allowedRoles.includes(user.role)) {
        setHasAccess(true);
        return;
      }

      // Check for temporary access (TEMPORARY - Phase 1 only)
      const tempAccess = sessionStorage.getItem(`${TEMP_ACCESS_KEY}_${routeType}`);
      if (tempAccess === 'true') {
        setHasAccess(true);
        return;
      }

      // No access
      setHasAccess(false);
    };

    checkAccess();
  }, [user, allowedRoles, routeType, searchParams, location.pathname]);

  // Show loading state while checking
  if (hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if no access
  if (!hasAccess) {
    return <AccessDenied routeType={routeType} />;
  }

  // User has access, render children
  return <>{children}</>;
};

/**
 * Access Denied Component
 * Shows when user tries to access admin/agent routes without permission
 */
const AccessDenied: React.FC<{ routeType: 'admin' | 'agent' }> = ({ routeType }) => {
  const { user } = useAuth();
  const roleName = routeType === 'admin' ? 'Admin' : 'Field Agent';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access {roleName} routes.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-foreground mb-1">Current Access Level</p>
              <p className="text-sm text-muted-foreground">
                {user ? `Logged in as: ${user.role}` : 'Not logged in'}
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-2">
              {routeType === 'admin' 
                ? 'Admin routes are restricted to platform administrators only.'
                : 'Field Agent routes are restricted to authorized field agents only.'}
            </p>
            <p className="text-xs text-muted-foreground italic">
              Note: This is a temporary frontend-only access control. Real RBAC will be implemented in Phase 2.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Home
          </Link>
          {user && (
            <Link
              to={user.role === 'farmer' ? '/farmer/dashboard' : user.role === 'buyer' ? '/buyer/dashboard' : '/'}
              className="inline-flex items-center justify-center px-6 py-3 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

