import { AnimatePresence } from 'motion/react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { ProtectedRoute, PublicOnlyRoute } from './components/routing/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { SiteLayout } from './layouts/SiteLayout';
import { AdminBrandsPage } from './pages/admin/AdminBrandsPage';
import { AdminHomePage } from './pages/admin/AdminHomePage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { BookingDetailPage } from './pages/bookings/BookingDetailPage';
import { BookingsListPage } from './pages/bookings/BookingsListPage';
import { BookTailorPage } from './pages/bookings/BookTailorPage';
import { BrandHomePage } from './pages/brand-panel/BrandHomePage';
import { BrandProductsPage } from './pages/brand-panel/BrandProductsPage';
import { BrandStoresPage } from './pages/brand-panel/BrandStoresPage';
import { CustomerHomePage } from './pages/customer/CustomerHomePage';
import { OutfitDetailPage } from './pages/customer/outfits/OutfitDetailPage';
import { OutfitsPage } from './pages/customer/outfits/OutfitsPage';
import { ProfilePage } from './pages/customer/profile/ProfilePage';
import { SavedPage } from './pages/customer/SavedPage';
import { StylistPage } from './pages/customer/stylist/StylistPage';
import { TryOnPage } from './pages/customer/tryon/TryOnPage';
import { LandingPage } from './pages/landing/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CheckoutPage } from './pages/orders/CheckoutPage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';
import { OrdersListPage } from './pages/orders/OrdersListPage';
import { BrandsPage } from './pages/shop/BrandsPage';
import { ProductPage } from './pages/shop/ProductPage';
import { ShopPage } from './pages/shop/ShopPage';
import { TailorHomePage } from './pages/tailor-panel/TailorHomePage';
import { TailorReviewsPage } from './pages/tailor-panel/TailorReviewsPage';
import { TailorShopPage } from './pages/tailor-panel/TailorShopPage';
import { TailorPage } from './pages/tailors/TailorPage';
import { TailorsPage } from './pages/tailors/TailorsPage';

/**
 * Route tree. Keying by the first path segment lets <AnimatePresence> animate between
 * sections (home -> shop -> login -> app); inside a dashboard the layout animates its pages.
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
          <Route path="tailors" element={<TailorsPage />} />
          <Route path="tailors/:slug" element={<TailorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="stylist" element={<Navigate to="/app/stylist" replace />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route path="app" element={<ProtectedRoute roles={['customer']} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<CustomerHomePage />} />
            <Route path="stylist" element={<StylistPage />} />
            <Route path="outfits" element={<OutfitsPage />} />
            <Route path="outfits/:id" element={<OutfitDetailPage />} />
            <Route path="try-on" element={<TryOnPage />} />
            <Route path="bookings" element={<BookingsListPage />} />
            <Route path="bookings/:id" element={<BookingDetailPage />} />
            <Route path="book/:slug" element={<BookTailorPage />} />
            <Route path="orders" element={<OrdersListPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="checkout/:brandId" element={<CheckoutPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="tailor" element={<ProtectedRoute roles={['tailor']} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<TailorHomePage />} />
            <Route path="bookings" element={<BookingsListPage />} />
            <Route path="bookings/:id" element={<BookingDetailPage />} />
            <Route path="shop" element={<TailorShopPage />} />
            <Route path="reviews" element={<TailorReviewsPage />} />
          </Route>
        </Route>

        <Route path="brand" element={<ProtectedRoute roles={['brand']} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<BrandHomePage />} />
            <Route path="orders" element={<OrdersListPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="products" element={<BrandProductsPage />} />
            <Route path="stores" element={<BrandStoresPage />} />
          </Route>
        </Route>

        <Route path="admin" element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<AdminHomePage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="brands" element={<AdminBrandsPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
