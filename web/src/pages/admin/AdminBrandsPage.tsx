import { RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { getSyncStatus, linkBrandOwner, listAdminBrands, listUsers, startCatalogueSync } from '../../api/panels.api';
import { Button } from '../../components/ui/Button';
import { ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAction } from '../../hooks/useAction';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import { timeAgo } from '../../utils/time';

/** Brands: who manages each one (partner brands sell on Kapra) and the nightly catalogue sync. */
export function AdminBrandsPage() {
  const { toast } = useToast();
  const brands = useApi((signal) => listAdminBrands(signal));
  const accounts = useApi((signal) => listUsers({ role: 'brand' }, signal));
  const status = useApi((signal) => getSyncStatus(signal));
  const [running, setRunning] = useState(false);
  const syncing = running || Boolean(status.data?.running);

  // While a sync runs, check every 5 seconds and refresh the reports when it ends.
  const reloadStatus = status.reload;
  const reloadBrands = brands.reload;
  useEffect(() => {
    if (!syncing) return;
    const timer = window.setInterval(async () => {
      const latest = await getSyncStatus().catch(() => null);
      if (latest && !latest.running) {
        setRunning(false);
        reloadStatus();
        reloadBrands();
        toast({ title: 'Catalogue sync finished' });
      }
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [syncing, reloadStatus, reloadBrands, toast]);

  const sync = useAction(async () => {
    await startCatalogueSync();
    setRunning(true);
    toast({ title: 'Sync started', description: 'Brands are fetched one by one; this takes a few minutes.', tone: 'info' });
  });
  const link = useAction(async (brandId: string, userId: string | null) => {
    await linkBrandOwner(brandId, userId);
    brands.reload();
    accounts.reload();
    toast({ title: userId ? 'Brand account linked and approved' : 'Brand account unlinked' });
  });

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Brands &"
        accent="sync"
        description="Every night each brand's public shop feed is imported and tagged. Link a verified brand account to make the brand a partner that sells on Kapra."
        actions={
          <Button onClick={() => sync.run()} loading={sync.running} disabled={syncing}>
            <motion.span animate={syncing ? { rotate: 360 } : { rotate: 0 }} transition={syncing ? { duration: 1.2, repeat: Infinity, ease: 'linear' } : undefined}>
              <RefreshCw size={15} />
            </motion.span>
            {syncing ? 'Syncing…' : 'Sync now'}
          </Button>
        }
      />
      {brands.error && <ErrorNote message={brands.error} onRetry={brands.reload} />}
      {brands.loading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {brands.data?.map((brand, index) => {
            const report = brand.lastSyncReport;
            return (
              <motion.div key={brand.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="rounded-[22px] border border-hairline bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg">{brand.name}</p>
                    <p className="text-xs text-muted">{brand.tier.replace('_', ' ')} · synced {brand.lastSyncedAt ? timeAgo(brand.lastSyncedAt) : 'never'}</p>
                  </div>
                  {brand.ownerId ? <StatusPill tone="olive">Partner</StatusPill> : <StatusPill tone="stone">Catalogue only</StatusPill>}
                </div>
                {report && (
                  <dl className="mt-4 grid grid-cols-5 gap-2 text-center">
                    {(['fetched', 'created', 'updated', 'hidden', 'skipped'] as const).map((key) => (
                      <div key={key} className="rounded-xl bg-paper/70 py-2">
                        <dt className="text-[10px] tracking-wide text-muted uppercase">{key}</dt>
                        <dd className="font-logo text-lg italic">{report[key]}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-muted">Managed by</span>
                  <select
                    value={brand.ownerId ?? ''}
                    disabled={link.running}
                    onChange={(event) => link.run(brand.id, event.target.value || null)}
                    className="flex-1 rounded-full border border-hairline bg-paper px-3 py-1.5 text-sm outline-none"
                  >
                    <option value="">No account (catalogue only)</option>
                    {accounts.data?.data.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} · {account.email}
                        {account.status === 'pending' ? ' (pending)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
