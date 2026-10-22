import { motion } from 'motion/react';
import { PageTransition } from '../../components/ui/PageTransition';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth';
import { ROLE_LABEL } from '../../utils/roles';

const INTRO: Record<UserRole, string> = {
  customer: 'Plan an outfit, try it on and get it stitched, all from here.',
  brand: 'Manage your collection, store locations and orders.',
  tailor: 'Manage your shop, services and stitching bookings.',
  admin: 'Verify brands and tailors and keep the platform healthy.',
};

function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** First page after login; shared by all roles, with role-specific text. */
export function DashboardHomePage() {
  const { user } = useAuth();
  if (!user) return null;

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-PK', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <PageTransition>
      <section className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
          {ROLE_LABEL[user.role]} dashboard
        </p>
        <h1 className="mt-3 text-4xl md:text-5xl">
          {greeting()},{' '}
          <span className="font-logo italic">
            {user.role === 'customer' ? user.name.split(' ')[0] : user.name}
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-muted">{INTRO[user.role]}</p>

        {user.status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            role="status"
            className="mt-8 max-w-xl rounded-2xl border border-amber-700/25 bg-amber-50 p-5"
          >
            <p className="font-semibold text-amber-900">Waiting for verification</p>
            <p className="mt-1 text-sm text-amber-900/80">
              An admin reviews every {user.role} account before it goes live. You will be able to
              {user.role === 'brand' ? ' list products' : ' accept bookings'} once approved.
            </p>
          </motion.div>
        )}

        <motion.dl
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-3"
        >
          {[
            ['Email', user.email],
            ['Status', user.status.charAt(0).toUpperCase() + user.status.slice(1)],
            ['Member since', memberSince],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-hairline bg-card p-5">
              <dt className="text-xs tracking-[0.14em] text-muted uppercase">{label}</dt>
              <dd className="mt-2 truncate font-semibold" title={value}>
                {value}
              </dd>
            </div>
          ))}
        </motion.dl>
      </section>
    </PageTransition>
  );
}
