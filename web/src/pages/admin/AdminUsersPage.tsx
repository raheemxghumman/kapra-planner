import { Search } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { listUsers, setUserStatus } from '../../api/panels.api';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Avatar } from '../../components/ui/Display';
import { EmptyState, ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { useAction } from '../../hooks/useAction';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import type { User, UserRole, UserStatus } from '../../types/auth';
import { formatDate } from '../../utils/time';

const STATUS_TONE = { active: 'olive', pending: 'blush', suspended: 'henna' } as const;

export function AdminUsersPage() {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [role, setRole] = useState<UserRole | 'all'>('all');
  const [status, setStatus] = useState<UserStatus | 'all'>((params.get('status') as UserStatus) ?? 'all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounce(q);
  const users = useApi(
    (signal) => listUsers({ role: role === 'all' ? undefined : role, status: status === 'all' ? undefined : status, q: search || undefined, page }, signal),
    [role, status, search, page],
  );
  const [suspending, setSuspending] = useState<User | null>(null);

  const change = useAction(async (user: User, next: UserStatus) => {
    await setUserStatus(user.id, next);
    setSuspending(null);
    users.reload();
    toast({ title: `${user.name} is now ${next}` });
  });

  return (
    <div>
      <PageHeader eyebrow="Admin" title="People on" accent="Kapra" description="Approve brands and tailors after checking their details; suspend accounts that break the rules (they are signed out at once)." />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs value={role} onChange={(value) => { setRole(value); setPage(1); }} tabs={[{ value: 'all', label: 'Everyone' }, { value: 'customer', label: 'Customers' }, { value: 'tailor', label: 'Tailors' }, { value: 'brand', label: 'Brands' }]} />
        <Tabs value={status} onChange={(value) => { setStatus(value); setPage(1); }} tabs={[{ value: 'all', label: 'Any status' }, { value: 'pending', label: 'Pending' }, { value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }]} />
        <div className="flex min-w-60 flex-1 items-center gap-2 rounded-full border border-hairline bg-card px-4">
          <Search size={15} className="text-muted" />
          <input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="Name or email" className="w-full bg-transparent py-2.5 text-sm outline-none" />
        </div>
      </div>

      {users.error && <ErrorNote message={users.error} onRetry={users.reload} />}
      {users.loading && !users.data ? (
        <Skeleton className="h-96" />
      ) : users.data?.data.length === 0 ? (
        <EmptyState title="Nobody matches" />
      ) : (
        <div className="overflow-x-auto rounded-[22px] border border-hairline bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs tracking-wide text-muted uppercase">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.data?.data.map((user) => (
                <tr key={user.id} className="border-b border-hairline/60 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} size={32} />
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 capitalize">{user.role}</td>
                  <td className="px-5 py-3">
                    <StatusPill tone={STATUS_TONE[user.status]}>{user.status}</StatusPill>
                  </td>
                  <td className="px-5 py-3 text-muted">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    {user.role !== 'admin' && (
                      <div className="flex justify-end gap-2">
                        {user.status !== 'active' && user.role !== 'brand' && (
                          <Button size="sm" onClick={() => change.run(user, 'active')}>
                            {user.status === 'pending' ? 'Approve' : 'Reactivate'}
                          </Button>
                        )}
                        {user.status === 'suspended' && user.role === 'brand' && (
                          <Button size="sm" onClick={() => change.run(user, 'active')}>
                            Reactivate
                          </Button>
                        )}
                        {user.status !== 'suspended' && (
                          <Button size="sm" variant="ghost" onClick={() => setSuspending(user)}>
                            Suspend
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {users.data && users.data.meta.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-muted">
            {page} / {users.data.meta.totalPages}
          </span>
          <Button size="sm" variant="ghost" disabled={page >= users.data.meta.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(suspending)}
        onClose={() => setSuspending(null)}
        onConfirm={() => suspending && change.run(suspending, 'suspended')}
        loading={change.running}
        title={`Suspend ${suspending?.name}?`}
        description="They are signed out everywhere and cannot log in until reactivated."
        confirmLabel="Suspend"
        danger
      />
    </div>
  );
}
