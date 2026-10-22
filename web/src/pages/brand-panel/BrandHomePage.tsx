import { Heart, Package, ScanFace, Sparkles, Wallet } from 'lucide-react';
import { Link } from 'react-router';
import { getBrandAnalytics, getOwnBrand } from '../../api/panels.api';
import { BarChart, BreakdownBars } from '../../components/charts/Charts';
import { ButtonLink } from '../../components/ui/Button';
import { Stat } from '../../components/ui/Display';
import { EmptyState, ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { useApi } from '../../hooks/useApi';
import { useRealtimeEvent } from '../../hooks/useRealtime';
import { ORDER_STATUS_LABEL, type OrderStatus } from '../../types/orders';
import { formatPrice, imageUrl } from '../../utils/format';

export function BrandHomePage() {
  const own = useApi((signal) => getOwnBrand(signal));
  const analytics = useApi((signal) => (own.data?.brand ? getBrandAnalytics(signal) : Promise.resolve(null)), [own.data?.brand?.id]);
  useRealtimeEvent('order.updated', analytics.reload);

  if (own.loading) return <Skeleton className="h-96" />;
  if (own.error) return <ErrorNote message={own.error} />;
  if (!own.data?.brand) {
    return (
      <div>
        <PageHeader eyebrow="Brand studio" title="Almost" accent="there" />
        <Panel>
          <EmptyState title="Waiting for verification" description="An admin checks your business and links your account to your brand. You will get a notification as soon as it is done." />
        </Panel>
      </div>
    );
  }

  const brand = own.data.brand;
  const data = analytics.data;

  return (
    <div>
      <PageHeader eyebrow="Brand studio" title={brand.name} accent="on Kapra" description="Sales and interest in your pieces over the last 30 days." actions={<ButtonLink to={`/shop?brand=${brand.slug}`} variant="ghost">View in catalogue</ButtonLink>} />
      {!data ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Revenue, 30 days" value={data.revenue30d} format={(n) => formatPrice(Math.round(n))} icon={<Wallet size={16} />} />
            <Stat label="Orders, 30 days" value={data.orders30d} icon={<Package size={16} />} />
            <Stat label="Live products" value={data.catalogue.visible} icon={<Sparkles size={16} />} note={`${data.catalogue.total} total · ${data.catalogue.manual} listed by hand`} />
            <Stat label="Saved by shoppers" value={data.interest.wishlistSaves} icon={<Heart size={16} />} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Panel eyebrow="Daily revenue" title="Last 30 days">
              <BarChart data={data.daily.map((row) => ({ label: new Date(row.day).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }), value: row.revenue }))} format={formatPrice} height={180} />
            </Panel>
            <Panel eyebrow="Orders" title="By status" delay={0.06}>
              {data.byStatus.length ? (
                <BreakdownBars items={data.byStatus.map((row) => ({ label: ORDER_STATUS_LABEL[row.status as OrderStatus] ?? row.status, value: row.count }))} />
              ) : (
                <p className="text-sm text-muted">No orders yet.</p>
              )}
              <Link to="/brand/orders" className="mt-6 block text-sm text-muted underline underline-offset-4 hover:text-ink">
                Manage orders
              </Link>
            </Panel>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Panel eyebrow="Best sellers" title="Top products" delay={0.1}>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-muted">Your best sellers will appear here after the first orders.</p>
              ) : (
                <ol className="space-y-3">
                  {data.topProducts.map((product, index) => (
                    <li key={product.productId ?? product.title} className="flex items-center gap-3">
                      <span className="w-5 font-logo text-lg italic">{index + 1}</span>
                      <img src={imageUrl(product.image ?? undefined, 100)} alt="" className="h-12 w-10 rounded-md bg-sand object-cover" />
                      <p className="min-w-0 flex-1 truncate text-sm">{product.title}</p>
                      <p className="text-sm text-muted">{product.units} sold</p>
                      <p className="w-24 text-right text-sm">{formatPrice(product.revenue)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
            <Panel eyebrow="Interest" title="How shoppers engage" delay={0.12}>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles size={15} className="text-muted" /> Picked by the AI stylist
                  </span>
                  <span className="font-logo text-xl italic">{data.interest.stylistPicks}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ScanFace size={15} className="text-muted" /> Virtual try-ons
                  </span>
                  <span className="font-logo text-xl italic">{data.interest.tryOns}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Heart size={15} className="text-muted" /> Wishlist saves
                  </span>
                  <span className="font-logo text-xl italic">{data.interest.wishlistSaves}</span>
                </li>
              </ul>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
