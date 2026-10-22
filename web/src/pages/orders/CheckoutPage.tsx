import { CreditCard, Lock, Truck } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { createOrder } from '../../api/bookings.api';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { TextField } from '../../components/ui/TextField';
import { useAction } from '../../hooks/useAction';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { FREE_SHIPPING_FROM, SHIPPING_FEE, type ShippingInput } from '../../types/orders';
import { formatPrice, imageUrl } from '../../utils/format';
import { isPakistaniMobile } from '../../utils/validators';

/** Checkout for one brand's items. The server recalculates prices, stock and delivery. */
export function CheckoutPage() {
  const { brandId = '' } = useParams();
  const { user } = useAuth();
  const { groups, clearBrand } = useCart();
  const group = groups.find((item) => item.brandId === brandId);
  const [shipping, setShipping] = useState<ShippingInput>({ name: user?.name ?? '', phone: user?.phone ?? '', address: '', city: user?.city ?? '' });
  const [touched, setTouched] = useState(false);

  const errors = {
    name: shipping.name.trim().length < 2 ? 'Enter the receiver’s name' : undefined,
    phone: isPakistaniMobile(shipping.phone) ? undefined : 'Enter a mobile number like 03001234567',
    address: shipping.address.trim().length < 5 ? 'Enter the full address' : undefined,
    city: shipping.city.trim().length < 2 ? 'Enter the city' : undefined,
  };
  const valid = Object.values(errors).every((error) => !error);

  const pay = useAction(async () => {
    const { checkoutUrl } = await createOrder({
      brandId,
      items: group!.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      shipping: { name: shipping.name.trim(), phone: shipping.phone.trim(), address: shipping.address.trim(), city: shipping.city.trim() },
    });
    clearBrand(brandId);
    window.location.assign(checkoutUrl);
  });

  if (!group) return <Navigate to="/app/orders" replace />;
  const fee = group.subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;

  return (
    <div>
      <PageHeader eyebrow="Checkout" title="Order from" accent={group.brandName} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <Panel eyebrow="Delivery" title="Where should it go?">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setTouched(true);
              if (valid) pay.run();
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <TextField label="Receiver’s name" value={shipping.name} error={touched ? errors.name : undefined} onChange={(event) => setShipping({ ...shipping, name: event.target.value })} />
            <TextField label="Mobile" placeholder="03001234567" value={shipping.phone} error={touched ? errors.phone : undefined} onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} />
            <TextField className="sm:col-span-2" label="Address" placeholder="House, street, sector" value={shipping.address} error={touched ? errors.address : undefined} onChange={(event) => setShipping({ ...shipping, address: event.target.value })} />
            <TextField label="City" value={shipping.city} error={touched ? errors.city : undefined} onChange={(event) => setShipping({ ...shipping, city: event.target.value })} />
            <div className="flex items-end sm:col-span-2">
              <Button type="submit" size="lg" className="w-full sm:w-auto" loading={pay.running}>
                <CreditCard size={16} /> Pay {formatPrice(group.subtotal + fee)}
              </Button>
            </div>
          </form>
          <p className="mt-4 flex items-center gap-1 text-xs text-muted">
            <Lock size={11} /> Card payment on Stripe’s secure page (test mode: card 4242 4242 4242 4242).
          </p>
        </Panel>

        <Panel eyebrow="Your order" title={`${group.items.length} item${group.items.length > 1 ? 's' : ''}`} delay={0.06}>
          <ul className="divide-y divide-hairline/70">
            {group.items.map((item) => (
              <li key={item.variantId} className="flex gap-3 py-3">
                <img src={imageUrl(item.image ?? undefined, 140)} alt="" className="h-16 w-12 rounded-md bg-sand object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.title}</p>
                  <p className="text-xs text-muted">
                    Size {item.size} · × {item.quantity}
                  </p>
                </div>
                <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-hairline pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatPrice(group.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="flex items-center gap-1 text-muted">
                <Truck size={13} /> Delivery
              </dt>
              <dd>{fee ? formatPrice(fee) : 'Free'}</dd>
            </div>
            <div className="flex justify-between border-t border-hairline pt-3 text-base">
              <dt>Total</dt>
              <dd className="font-logo text-2xl italic">{formatPrice(group.subtotal + fee)}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
