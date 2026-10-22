import { AnimatePresence } from 'motion/react';
import { Route, Routes, useLocation } from 'react-router';
import { PublicLayout } from './layouts/PublicLayout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * Route tree. Keying <Routes> by the path lets <AnimatePresence> play the old page's exit
 * animation before the new page enters (see PageTransition).
 * Customer, brand, tailor and admin areas are added with their own layouts in week 1.
 */
export function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
