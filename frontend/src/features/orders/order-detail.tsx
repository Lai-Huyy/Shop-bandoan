import { MapPin, Package, ReceiptText } from 'lucide-react';
import type { ReactNode } from 'react';
import { OrderStatusBadge, OrderTimeline, PaymentStatusBadge } from './order-status';
import type { Order } from '@/types/order';

function money(value: string): string {
  return `${Number(value).toLocaleString('vi-VN')} ₫`;
}

export function OrderDetail({ order, showCustomer = false }: { order: Order; showCustomer?: boolean }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-sm text-muted-foreground">Mã đơn hàng</p><h2 className="text-xl font-bold text-primary">{order.orderNumber}</h2><p className="mt-1 text-sm text-muted-foreground">Tạo lúc {new Date(order.createdAt).toLocaleString('vi-VN')}</p></div>
          <div className="flex flex-wrap gap-2"><OrderStatusBadge status={order.status} /><PaymentStatusBadge status={order.paymentStatus} /></div>
        </div>
      </section>

      {showCustomer && order.user ? <section className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">Khách hàng</h3><p className="mt-2">{order.user.fullName}</p><p className="text-sm text-muted-foreground">{order.user.phone ?? 'Chưa có số điện thoại'} · {order.user.email}</p></section> : null}

      <section className="rounded-2xl border bg-card p-5">
        <h3 className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-primary" />Địa chỉ nhận hàng</h3>
        <p className="mt-3 font-medium">{order.shippingRecipientName} · {order.shippingRecipientPhone}</p>
        <p className="mt-1 text-sm text-muted-foreground">{[order.shippingStreetAddress, order.shippingWardName, order.shippingProvinceName].filter(Boolean).join(', ')}</p>
        {order.shippingAddressNote ? <p className="mt-2 text-sm text-muted-foreground">Ghi chú: {order.shippingAddressNote}</p> : null}
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h3 className="flex items-center gap-2 font-semibold"><Package className="h-4 w-4 text-primary" />Sản phẩm ({order.items.length})</h3>
        <div className="mt-3 divide-y">
          {order.items.map((item) => <article key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0"><ProductThumbnail url={item.product.images[0]?.url} name={item.productName} /><div className="min-w-0 flex-1"><p className="font-medium">{item.productName}</p>{item.selectedOptionsSnapshot?.length ? <p className="mt-1 text-xs text-muted-foreground">{item.selectedOptionsSnapshot.join(' · ')}</p> : null}<p className="mt-1 text-sm text-muted-foreground">{money(item.unitPrice)} × {item.quantity}</p></div><p className="whitespace-nowrap font-semibold">{money(item.totalPrice)}</p></article>)}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h3 className="flex items-center gap-2 font-semibold"><ReceiptText className="h-4 w-4 text-primary" />Thanh toán</h3>
        <dl className="mt-3 grid gap-2 text-sm"><Summary label="Tạm tính" value={money(order.subtotal)} /><Summary label={order.coupon ? `Mã giảm giá: ${order.coupon.code}` : 'Giảm giá'} value={`-${money(order.discountAmount)}`} /><Summary label="Phí giao hàng" value={money(order.shippingFee)} /><Summary label="Tổng thanh toán" value={money(order.totalAmount)} strong /><Summary label="Phương thức" value={order.payment?.provider ?? order.paymentMethod} /><Summary label="Trạng thái thanh toán" value={order.payment ? <PaymentStatusBadge status={order.payment.status} /> : <PaymentStatusBadge status={order.paymentStatus} />} /></dl>
      </section>

      <section className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">Hành trình đơn hàng</h3><div className="mt-4"><OrderTimeline logs={order.statusLogs} status={order.status} /></div></section>
    </div>
  );
}

function Summary({ label, value, strong = false }: { label: string; value: ReactNode; strong?: boolean }) {
  return <div className={`flex items-center justify-between gap-4 ${strong ? 'border-t pt-3 text-base font-bold' : ''}`}><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>;
}

function ProductThumbnail({ url, name }: { url?: string; name: string }) {
  if (!url) return <div className="h-14 w-14 shrink-0 rounded-lg bg-muted" aria-hidden="true" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={name} className="h-14 w-14 shrink-0 rounded-lg border object-cover" />;
}
