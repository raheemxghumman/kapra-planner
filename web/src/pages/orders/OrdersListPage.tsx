import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { listOrders } from '../../api/bookings.api';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeEvent } from '../../hooks/useRealtime';
import { ORDER_STATUS_LABEL, type OrderStatus } from '../../types/orders';
import { formatPrice, imageUrl } from '../../utils/format';
import { orderTone } from '../../utils/status';
import { timeAgo } from '../../utils/time';

type Filter = 'all' | OrderStatus;

/** Orders for customers (/app/orders) and brands (/brand/orders). */
export function OrdersListPage() {
  const { user } = useAuth();
  const asBrand = user?.role === 'brand';
  const [filter, setFilter] = useState<Filter>(asBrand ? 'paid' : 'all');
  const orders = useApi((signal) => listOrders({ status: filter === 'all' ? undefined : filter, limit: 40 }, signal), [filter]);
  useRealtimeEvent('order.updated', orders.reload);
  const base = asBrand ? '/brand/orders' : '/app/orders';

  return (
    <div>
      <PageHeader eyebrow={asBrand ? 'Sales' : 'Shopping'} title={asBrand ? 'Orders to' : 'Your'} accent={asBrand ? 'fulfil' : 'orders'} actions={!asBrand && <ButtonLink to="/shop" variant="ghost">Keep shopping</ButtonLink>} />
      <Tabs
        className="mb-6"
        value={filter}
        onChange={setFilter}
        tabs={
          asBrand
            ? [
                { value: 'paid', label: 'To ship' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'all', label: 'All' },
              ]
            : [
                { value: 'all', label: 'All' },
                { value: 'pending_payment', label: 'To pay' },
                { value: 'shipped', label: 'On the way' },
                { value: 'delivered', label: 'Delivered' },
              ]
        }
      />
      {orders.error && <ErrorNote message={orders.error} onRetry={orders.reload} />}
      {orders.loading && !orders.data ? (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-24" />
          ))}
        </div>
      ) : orders.data?.data.length === 0 ? (
        <EmptyState title="No orders here" description={asBrand ? 'Paid orders appear here and in your notifications.' : 'Partner brands can be bought right on Kapra.'} action={!asBrand && <ButtonLink to="/shop">Browse the catalogue</ButtonLink>} />
      ) : (
        <ul className="space-y-3">
          {orders.data?.data.map((order, index) => (
            <motion.li key={order.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Link to={`${base}/${order.id}`} className="flex items-center gap-4 rounded-[20px] border border-hairline bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-ink">
                <div className="flex -space-x-4">
                  {order.items.slice(0, 3).map((item) => (
                    <img key={item.id} src={imageUrl(item.image ?? undefined, 120)} alt="" className="h-16 w-12 rounded-lg border-2 border-card bg-sand object-cover" />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{asBrand ? order.shipName : order.brand.name}</p>
                  <p className="text-sm text-muted">
                    {order.code} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items · {order.shipCity}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusPill tone={orderTone(order.status)} pulse={asBrand && order.status === 'paid'}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </StatusPill>
                  <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                  <p className="text-[11px] text-stone">{timeAgo(order.createdAt)}</p>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
