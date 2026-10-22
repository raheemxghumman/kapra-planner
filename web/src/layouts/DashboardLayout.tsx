import { motion } from 'motion/react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { NAV_ITEMS, ROLE_LABEL } from '../utils/roles';

/**
 * Frame for every logged-in area. The navigation comes from NAV_ITEMS for the user's role,
 * so customers, brands, tailors and admins each see only their own sections.
 */
export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-hairline bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
          <Link to="/" className="font-logo text-2xl italic" aria-label="Kapra Planner home">
            kapra
          </Link>
          <nav className="flex flex-1 gap-1" aria-label="Main">
            {NAV_ITEMS[user.role].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className="relative rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-ink aria-[current=page]:text-ink"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-paper shadow-sm"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-tight font-semibold">{user.name}</p>
              <p className="text-xs tracking-[0.14em] text-muted uppercase">{ROLE_LABEL[user.role]}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-hairline px-4 py-2 text-sm transition-colors hover:bg-paper"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
