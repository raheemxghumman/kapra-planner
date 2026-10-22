import { Bot, Scissors, ShoppingBag, Users } from 'lucide-react';
import { Link } from 'react-router';
import { getAdminStats, setUserStatus } from '../../api/panels.api';
import { BarChart, BreakdownBars } from '../../components/charts/Charts';
import { Button } from '../../components/ui/Button';
import { Avatar, Stat } from '../../components/ui/Display';
import { ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAction } from '../../hooks/useAction';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import { BOOKING_STATUS_LABEL, type BookingStatus } from '../../types/bookings';
import { formatPrice } from '../../utils/format';
import { timeAgo } from '../../utils/time';

export function AdminHomePage() {
  const { toast } = useToast();
  const stats = useApi((signal) => getAdminStats(signal));
  const approve = useAction(async (id: string, name: string) => {
    await setUserStatus(id, 'active');
    toast({ title: `${name} approved` });
    stats.reload();
  });

  if (stats.loading && !stats.data) return <Skeleton className="h-[600px]" />;
  if (stats.error || !stats.data) return <ErrorNote message={stats.error ?? 'Could not load'} onRetry={stats.reload} />;
  const s = stats.data;
  const users = s.users.reduce((sum, row) => sum + row.count, 0);
  const revenue = s.revenue.reduce((sum, row) => sum + row.total, 0);
  const bookings = s.bookings.reduce((sum, row) => sum + row.count, 0);
  const stylistTotal = s.ai.stylistAi + s.ai.stylistRules;

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Kapra at a" accent="glance" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Users" value={users} icon={<Users size={16} />} note={`${s.catalogue.tailors} tailors · ${s.catalogue.partnerBrands} partner brands`} />
        <Stat label="Payments received" value={revenue} format={(n) => formatPrice(Math.round(n))} icon={<ShoppingBag size={16} />} note={s.revenue.map((row) => `${row.count} ${row.purpose}${row.count === 1 ? '' : 's'}`).join(' · ') || 'None yet'} />
        <Stat label="Tailor bookings" value={bookings} icon={<Scissors size={16} />} />
        <Stat label="Stylist requests" value={stylistTotal} icon={<Bot size={16} />} note={`${stylistTotal ? Math.round((s.ai.stylistAi / stylistTotal) * 100) : 0}% by AI · avg ${s.ai.stylistAvgMs ? (s.ai.stylistAvgMs / 1000).toFixed(1) : '—'} s`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel eyebrow="Last 14 days" title="Payments per day">
          <BarChart data={s.daily.map((row) => ({ label: new Date(row.day).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }), value: row.revenue }))} format={formatPrice} height={170} />
        </Panel>
        <Panel eyebrow="Waiting" title="Accounts to verify" delay={0.06} actions={<Link to="/admin/users?status=pending" className="text-sm text-muted hover:text-ink">All</Link>}>
          {s.pending.length === 0 ? (
            <p className="text-sm text-muted">Nobody is waiting. New brand and tailor sign-ups appear here.</p>
          ) : (
            <ul className="space-y-3">
              {s.pending.map((user) => (
                <li key={user.id} className="flex items-center gap-3">
                  <Avatar name={user.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted">
                      {user.role} · {timeAgo(user.createdAt)}
                    </p>
                  </div>
                  {user.role === 'brand' ? (
                    <Link to="/admin/brands" className="text-xs underline underline-offset-4">
                      Link brand
                    </Link>
                  ) : (
                    <Button size="sm" loading={approve.running} onClick={() => approve.run(user.id, user.name)}>
                      Approve
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel eyebrow="Bookings" title="By status" delay={0.1}>
          <BreakdownBars items={s.bookings.map((row) => ({ label: BOOKING_STATUS_LABEL[row.status as BookingStatus] ?? row.status, value: row.count }))} />
        </Panel>
        <Panel eyebrow="AI" title="Features in use" delay={0.12}>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between"><span>Stylist (AI)</span><span>{s.ai.stylistAi}</span></li>
            <li className="flex justify-between"><span>Stylist (fallback rules)</span><span>{s.ai.stylistRules}</span></li>
            <li className="flex justify-between"><span>Try-ons completed</span><span>{s.ai.tryOnsDone}</span></li>
            <li className="flex justify-between"><span>Try-ons failed</span><span>{s.ai.tryOnsFailed}</span></li>
          </ul>
        </Panel>
        <Panel eyebrow="Catalogue" title="Products" delay={0.14}>
          <p className="font-logo text-5xl italic">{s.catalogue.products.toLocaleString('en-PK')}</p>
          <p className="mt-1 text-sm text-muted">live pieces from {s.catalogue.brands} brands</p>
          <p className="mt-4 text-sm">
            Last sync <StatusPill tone="sand">{s.catalogue.lastSync ? timeAgo(s.catalogue.lastSync) : 'never'}</StatusPill>
          </p>
          <p className="mt-2 text-sm text-muted">{s.catalogue.reviews} tailor reviews</p>
        </Panel>
      </div>
    </div>
  );
}
