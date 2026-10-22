import { CheckCircle2, CreditCard, PackageCheck, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { confirmPayment, getOrder, orderAction, payOrder } from '../../api/bookings.api';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ErrorNote, Skeleton } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Modal';
import { Panel } from '../../components/ui/Panel';
import { StatusPill } from '../../components/ui/StatusPill';
import { TextField } from '../../components/ui/TextField';
import { useAction } from '../../hooks/useAction';
import { useApi } from '../../hooks/useApi';
import { useRealtimeEvent } from '../../hooks/useRealtime';
import { useToast } from '../../hooks/useToast';
import { ORDER_STATUS_LABEL } from '../../types/orders';
import { cn, formatPrice, imageUrl } from '../../utils/format';
import { orderTone, PAYMENT_LABEL } from '../../utils/status';
import { formatDateTime } from '../../utils/time';

const STEPS = [
  { key: 'paidAt', label: 'Paid', icon: CreditCard },
  { key: 'shippedAt', label: 'Shipped', icon: Truck },
  { key: 'deliveredAt', label: 'Delivered', icon: PackageCheck },
] as const;

/** One order, for the customer and for the brand that ships it. */
export function OrderDetailPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { toast } = useToast();
  const order = useApi((signal) => getOrder(id, signal), [id]);
  const [shipping, setShipping] = useState(false);
  const [tracking, setTracking] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const confirmed = useRef<string | null>(null);
  useRealtimeEvent<{ id: string }>('order.updated', (event) => event.id === id && order.reload());

  const sessionId = params.get('session_id');
  const reloadOrder = order.reload;
  useEffect(() => {
    if (!sessionId || confirmed.current === sessionId) return;
    confirmed.current = sessionId;
    confirmPayment(sessionId)
      .then((payment) => {
        if (payment.status === 'paid') toast({ title: 'Payment received', description: 'The brand will ship your order soon.' });
        reloadOrder();
      })
      .catch(() => toast({ title: 'We could not confirm the payment yet', tone: 'error' }))
      .finally(() => setParams({}, { replace: true }));
  }, [sessionId, toast, reloadOrder, setParams]);

  const act = useAction(async (action: 'ship' | 'deliver' | 'cancel', extra: { trackingNumber?: string; reason?: string } = {}) => {
    await orderAction(id, action, extra);
    setShipping(false);
    setCancelling(false);
    order.reload();
    toast({ title: action === 'ship' ? 'Marked as shipped' : action === 'deliver' ? 'Marked as delivered' : 'Order cancelled' });
  });
  const pay = useAction(async () => window.location.assign((await payOrder(id)).checkoutUrl));

  if (order.loading && !order.data) return <Skeleton className="h-[500px]" />;
  if (order.error || !order.data) return <ErrorNote message={order.error ?? 'Order not found'} />;
  const item = order.data;
  const asBrand = item.viewerRole === 'brand';

  return (
    <div>
      <Link to={asBrand ? '/brand/orders' : '/app/orders'} className="eyebrow text-muted hover:text-ink">
        ← Orders
      </Link>
      <header className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <StatusPill tone={orderTone(item.status)}>{ORDER_STATUS_LABEL[item.status]}</StatusPill>
            <span className="font-mono text-xs text-muted">{item.code}</span>
          </div>
          <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.8rem)] leading-tight tracking-[-0.02em]">
            {asBrand ? `Order for ${item.shipName}` : item.brand.name} <span className="font-logo italic">{formatPrice(item.total)}</span>
          </h1>
          {item.payment && <p className="mt-1 text-muted">{PAYMENT_LABEL[item.payment.status]}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {item.status === 'pending_payment' && item.viewerRole === 'customer' && (
            <Button onClick={() => pay.run()} loading={pay.running}>
              <CreditCard size={15} /> Pay now
            </Button>
          )}
          {item.actions.includes('ship') && <Button onClick={() => setShipping(true)}>Ship order</Button>}
          {item.actions.includes('deliver') && (
            <Button onClick={() => act.run('deliver')} loading={act.running}>
              {asBrand ? 'Mark delivered' : 'I received it'}
            </Button>
          )}
          {item.actions.includes('cancel') && (
            <Button variant="ghost" onClick={() => setCancelling(true)}>
              Cancel order
            </Button>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {item.status !== 'cancelled' && item.status !== 'pending_payment' && (
            <Panel eyebrow="Tracking" title="Delivery progress">
              <div className="grid grid-cols-3 gap-2">
                {STEPS.map((step, index) => {
                  const at = item[step.key];
                  return (
                    <motion.div key={step.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={cn('rounded-2xl p-4', at ? 'bg-olive text-paper' : 'bg-paper text-muted')}>
                      {at ? <CheckCircle2 size={18} /> : <step.icon size={18} />}
                      <p className="mt-3 text-sm font-semibold">{step.label}</p>
                      <p className="text-xs opacity-75">{at ? formatDateTime(at) : 'Waiting'}</p>
                    </motion.div>
                  );
                })}
              </div>
              {item.trackingNumber && (
                <p className="mt-4 text-sm">
                  Courier tracking number: <span className="font-mono font-semibold">{item.trackingNumber}</span>
                </p>
              )}
            </Panel>
          )}
          {item.status === 'cancelled' && <ErrorNote message={`This order was cancelled${item.cancelReason ? `: ${item.cancelReason}` : '.'}`} />}

          <Panel eyebrow="Items" title={`${item.items.length} piece${item.items.length > 1 ? 's' : ''}`} delay={0.06}>
            <ul className="divide-y divide-hairline/70">
              {item.items.map((line) => (
                <li key={line.id} className="flex gap-4 py-3">
                  <img src={imageUrl(line.image ?? undefined, 160)} alt="" className="h-20 w-16 rounded-lg bg-sand object-cover" />
                  <div className="min-w-0 flex-1">
                    {line.productId ? (
                      <Link to={`/shop/${line.productId}`} className="text-sm hover:underline">
                        {line.title}
                      </Link>
                    ) : (
                      <p className="text-sm">{line.title}</p>
                    )}
                    <p className="text-xs text-muted">
                      Size {line.size} · {formatPrice(line.unitPrice)} × {line.quantity}
                    </p>
                  </div>
                  <p className="text-sm">{formatPrice(line.unitPrice * line.quantity)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel eyebrow="Deliver to" title={item.shipName} delay={0.08}>
            <p className="text-sm leading-relaxed">
              {item.shipAddress}
              <br />
              {item.shipCity}
              <br />
              {item.shipPhone}
            </p>
          </Panel>
          <Panel eyebrow="Payment" title="Summary" delay={0.1}>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatPrice(item.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd>{item.shippingFee ? formatPrice(item.shippingFee) : 'Free'}</dd>
              </div>
              <div className="flex justify-between border-t border-hairline pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(item.total)}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>

      <Modal
        open={shipping}
        onClose={() => setShipping(false)}
        title="Ship this order"
        description="The customer is notified with the tracking number."
        footer={
          <Button size="sm" disabled={tracking.trim().length < 4} loading={act.running} onClick={() => act.run('ship', { trackingNumber: tracking.trim() })}>
            Mark shipped
          </Button>
        }
      >
        <TextField label="Courier tracking number" placeholder="e.g. TCS-77341209" value={tracking} onChange={(event) => setTracking(event.target.value)} />
      </Modal>
      <ConfirmDialog
        open={cancelling}
        onClose={() => setCancelling(false)}
        onConfirm={(reason) => act.run('cancel', { reason })}
        loading={act.running}
        title="Cancel this order?"
        description={item.status === 'paid' ? `${formatPrice(item.total)} will be refunded to the card.` : undefined}
        confirmLabel="Cancel order"
        danger
        askReason={{ label: 'Reason (optional)' }}
      />
    </div>
  );
}
