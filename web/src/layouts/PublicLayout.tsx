import { Link, Outlet } from 'react-router';
import { ApiStatus } from '../components/ui/ApiStatus';
import { useAuth } from '../hooks/useAuth';
import { DASHBOARD_PATH } from '../utils/roles';

/** Frame for pages anyone can see: top bar with the logo, API status and account links. */
export function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-hairline bg-card/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link to="/" className="font-logo text-2xl italic" aria-label="Kapra Planner home">
            kapra
          </Link>
          <div className="flex items-center gap-5">
            <span className="hidden sm:inline-flex">
              <ApiStatus />
            </span>
            {user ? (
              <Link
                to={DASHBOARD_PATH[user.role]}
                className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper transition-colors hover:bg-olive"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold hover:underline">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper transition-colors hover:bg-olive"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="border-t border-hairline px-5 py-6 text-center text-xs tracking-[0.16em] text-muted uppercase">
        Kapra Planner · Air University Islamabad · 2026
      </footer>
    </div>
  );
}
