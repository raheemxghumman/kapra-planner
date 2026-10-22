import { AnimatePresence } from 'motion/react';
import { Route, Routes, useLocation } from 'react-router';
import { ProtectedRoute, PublicOnlyRoute } from './components/routing/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardHomePage } from './pages/dashboard/DashboardHomePage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

/** Each role's area: URL prefix and which role may enter it. */
const ROLE_AREAS = [
  { path: 'app', role: 'customer' },
  { path: 'brand', role: 'brand' },
  { path: 'tailor', role: 'tailor' },
  { path: 'admin', role: 'admin' },
] as const;

/**
 * Route tree. Keying <Routes> by the path lets <AnimatePresence> play the old page's exit
 * animation before the new page enters (see PageTransition).
 */
export function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
        </Route>

        <Route element={<PublicOnlyRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {ROLE_AREAS.map((area) => (
          <Route key={area.path} path={area.path} element={<ProtectedRoute roles={[area.role]} />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<DashboardHomePage />} />
            </Route>
          </Route>
        ))}

        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
