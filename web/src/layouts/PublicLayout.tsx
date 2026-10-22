import { Link, Outlet } from 'react-router';
import { ApiStatus } from '../components/ui/ApiStatus';

/** Frame for pages anyone can see: top bar with the logo, navigation and API status. */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-hairline bg-card/80 backdrop-blur-md">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="font-logo text-2xl italic" aria-label="Kapra Planner home">
            kapra
          </Link>
          <ApiStatus />
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
