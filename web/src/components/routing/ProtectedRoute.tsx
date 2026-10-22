import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth';
import { DASHBOARD_PATH } from '../../utils/roles';
import { FullPageLoader } from '../ui/FullPageLoader';

/**
 * Guards a group of routes in the browser:
 * - not logged in -> login page (remembering where the user wanted to go);
 * - logged in with another role -> their own dashboard.
 * The API checks the same rules again; this only improves the experience.
 */
export function ProtectedRoute({ roles }: { roles: UserRole[] }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullPageLoader />;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={DASHBOARD_PATH[user.role]} replace />;
  }
  return <Outlet />;
}

/** Login and register pages: a logged-in user is sent to their dashboard instead. */
export function PublicOnlyRoute() {
  const { user, status } = useAuth();
  if (status === 'loading') {
    return <FullPageLoader />;
  }
  return user ? <Navigate to={DASHBOARD_PATH[user.role]} replace /> : <Outlet />;
}
