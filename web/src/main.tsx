import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { SmoothScroll } from './components/motion/SmoothScroll';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartProvider';
import { RealtimeProvider } from './context/RealtimeProvider';
import { ToastProvider } from './context/ToastProvider';
import { WishlistProvider } from './context/WishlistProvider';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found in index.html');
}

// Providers, outermost first: router -> toasts -> who is logged in -> live socket ->
// saved pieces -> cart -> smooth scrolling -> the pages.
createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <RealtimeProvider>
            <WishlistProvider>
              <CartProvider>
                <SmoothScroll>
                  <App />
                </SmoothScroll>
              </CartProvider>
            </WishlistProvider>
          </RealtimeProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
