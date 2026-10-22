import { ArrowUpRight, LogOut, Menu, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router';
import { NotificationBell } from '../components/layout/NotificationBell';
import { CartDrawer } from '../components/shop/CartDrawer';
import { Avatar } from '../components/ui/Display';
import { Sheet } from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import type { User } from '../types/auth';
import { cn } from '../utils/format';
import { NAV_ITEMS, ROLE_LABEL } from '../utils/roles';

function NavList({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  const root = NAV_ITEMS[user.role][0].to;
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Dashboard">
      {NAV_ITEMS[user.role].map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === root}
          onClick={onNavigate}
          className="group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink/65 transition-colors hover:text-ink aria-[current=page]:text-ink"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="dash-nav"
                  className="absolute inset-0 rounded-xl border border-hairline bg-card shadow-[0_8px_20px_-14px_rgba(43,41,38,0.5)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <item.icon size={17} strokeWidth={isActive ? 2 : 1.6} className="relative" />
              <span className="relative">{item.label}</span>
              {isActive && <motion.span layoutId="dash-dot" className="relative ml-auto h-1.5 w-1.5 rounded-full bg-henna" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Frame for every logged-in area: a sidebar with the role's sections (a sheet on phones), a top
 * bar with live notifications (and the cart for customers), and animated page changes.
 */
export function DashboardLayout() {
  const { user, logout } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const accountCard = (
    <div className="rounded-2xl border border-hairline bg-paper/60 p-3">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} size={38} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link to="/" className="flex flex-1 items-center justify-center gap-1 rounded-full border border-hairline px-3 py-1.5 text-xs hover:border-ink">
          Site <ArrowUpRight size={12} />
        </Link>
        <button type="button" onClick={handleLogout} className="flex flex-1 items-center justify-center gap-1 rounded-full border border-hairline px-3 py-1.5 text-xs hover:border-henna hover:text-henna">
          <LogOut size={12} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="grain min-h-screen lg:pl-[264px]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-hairline bg-[#e6e0d5] px-4 py-6 lg:flex">
        <Link to="/" className="px-3 font-logo text-[30px] leading-none italic" aria-label="Kapra Planner home">
          kapra
        </Link>
        <p className="eyebrow mt-2 px-3 text-muted">{ROLE_LABEL[user.role]} studio</p>
        <div className="mt-8 flex-1">
          <NavList user={user} />
        </div>
        {user.status === 'pending' && (
          <div className="mb-3 rounded-2xl bg-blush/50 p-3 text-xs leading-relaxed text-henna">
            Your account is waiting for an admin to verify it. You can set things up meanwhile.
          </div>
        )}
        {accountCard}
      </aside>

      <header className="sticky top-0 z-20 border-b border-hairline/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5 md:px-8">
          <button type="button" onClick={() => setMenuOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-hairline lg:hidden" aria-label="Open menu">
            <Menu size={17} />
          </button>
          <Link to="/" className="font-logo text-2xl italic lg:hidden">
            kapra
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {user.role === 'customer' && (
              <>
                <Link to="/shop" className="hidden rounded-full px-4 py-2 text-sm text-muted hover:text-ink sm:block">
                  Browse the catalogue
                </Link>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => cart.setOpen(true)}
                  className="relative grid h-10 w-10 place-items-center rounded-full border border-hairline bg-card hover:border-ink"
                  aria-label={`Cart, ${cart.count} items`}
                >
                  <ShoppingBag size={17} strokeWidth={1.7} />
                  {cart.count > 0 && (
                    <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-paper">{cart.count}</span>
                  )}
                </motion.button>
              </>
            )}
            <NotificationBell />
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={cn('mx-auto max-w-6xl px-5 pt-8 pb-24 md:px-8')}
        >
          {outlet}
        </motion.main>
      </AnimatePresence>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={<span className="font-logo text-3xl italic">kapra</span>} description={`${ROLE_LABEL[user.role]} studio`}>
        <NavList user={user} onNavigate={() => setMenuOpen(false)} />
        <div className="mt-8">{accountCard}</div>
      </Sheet>
      {user.role === 'customer' && <CartDrawer />}
    </div>
  );
}
