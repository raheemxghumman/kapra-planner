import { AnimatePresence } from 'motion/react';
import { Route, Routes, useLocation } from 'react-router';
import { ProtectedRoute, PublicOnlyRoute } from './components/routing/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { SiteLayout } from './layouts/SiteLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardHomePage } from './pages/dashboard/DashboardHomePage';
import { LandingPage } from './pages/landing/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { BrandsPage } from './pages/shop/BrandsPage';
import { ProductPage } from './pages/shop/ProductPage';
import { ShopPage } from './pages/shop/ShopPage';

/** Each role's area: URL prefix and which role may enter it. */
const ROLE_AREAS = [
  { path: 'app', role: 'customer' },
  { path: 'brand', role: 'brand' },
  { path: 'tailor', role: 'tailor' },
  { path: 'admin', role: 'admin' },
] as const;

/**
 * Route tree. Keying by the first path segment lets <AnimatePresence> animate between
 * sections (home -> shop -> login) while moving inside a section stays instant.
 */
export function App() {
  const location = useLocation();
  const section = location.pathname.split('/')[1] || 'home';

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={section}>
        <Route element={<SiteLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/:id" element={<ProductPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="*" element={<NotFoundPage />} />
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
      </Routes>
    </AnimatePresence>
  );
}
