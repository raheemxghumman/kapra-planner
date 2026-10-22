import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { SmoothScroll } from './components/motion/SmoothScroll';
import { AuthProvider } from './context/AuthContext';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SmoothScroll>
          <App />
        </SmoothScroll>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
