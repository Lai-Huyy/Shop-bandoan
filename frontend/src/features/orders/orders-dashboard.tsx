'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { canCancelOrder, OrderStatusBadge, PaymentStatusBadge } from './order-status';
import { ordersService } from '@/services/orders.service';
import type { OrderStatus } from '@/types/order';

const tabs: Array<{ label: string; status?: OrderStatus }> = [
  { label: 'Tất cả' }, { label: 'Chờ xác nhận', status: 'PENDING' }, { label: 'Đã xác nhận', status: 'CONFIRMED' }, { label: 'Đang chuẩn bị', status: 'PREPARING' }, { label: 'Đang giao', status: 'OUT_FOR_DELIVERY' }, { label: 'Đã giao', status: 'DELIVERED' }, { label: 'Đã hủy', status: 'CANCELLED' },
];

export function OrdersDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const [page, setPage] = useState(1);
  const orders = useQuery({ queryKey: ['orders', status, page], queryFn: () => ordersService.list({ page, limit: 10, status }) });
  const cancel = useMutation({ mutationFn: ordersService.cancel, onSuccess: () => { toast.success('Đã hủy đơn hàng.'); void queryClient.invalidateQueries({ queryKey: ['orders'] }); }, onError: () => toast.error('Không thể hủy đơn hàng này.') });
  const buyAgain = useMutation({ mutationFn: ordersService.buyAgain, onSuccess: () => { toast.success('Đã thêm sản phẩm vào giỏ hàng.'); void queryClient.invalidateQueries({ queryKey: ['cart'] }); router.push('/cart'); }, onError: () => toast.error('Không thể mua lại vì có sản phẩm không còn bán.') });
  const selectTab = (nextStatus?: OrderStatus) => { setStatus(nextStatus); setPage(1); };

  return <section className="space-y-6"><div><p className="text-sm font-semibold text-primary">THEO DÕI MUA SẮM</p><h1 className="text-3xl font-bold">Đơn hàng của tôi</h1></div><nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Lọc trạng thái đơn hàng">{tabs.map((tab) => <Button key={tab.label} variant={status === tab.status ? 'default' : 'outline'} size="sm" className="shrink-0" onClick={() => selectTab(tab.status)}>{tab.label}</Button>)}</nav>{orders.isLoading ? <OrderListSkeleton /> : orders.error ? <OrderListError /> : !orders.data?.items.length ? <EmptyState title="Chưa có đơn hàng" description="Đơn hàng của bạn sẽ xuất hiện tại đây." action={<Button asChild><Link href="/products">Mua sắm ngay</Link></Button>} /> : <><div className="space-y-4">{orders.data.items.map((order) => <article key={order.id} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-primary">{order.orderNumber}</p><p className="mt-1 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString('vi-VN')} · {order.items.length} sản phẩm</p></div><OrderStatusBadge status={order.status} /></div><div className="mt-4 flex items-center gap-3 border-y py-3"><OrderThumbnail url={order.items[0]?.product.images[0]?.url} name={order.items[0]?.productName ?? ''} /><div className="min-w-0 flex-1"><p className="truncate font-medium">{order.items[0]?.productName}</p><p className="text-sm text-muted-foreground">{order.items.length > 1 ? `và ${order.items.length - 1} sản phẩm khác` : 'Đơn hàng của bạn'}</p></div><p className="font-bold">{Number(order.totalAmount).toLocaleString('vi-VN')} ₫</p></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><PaymentStatusBadge status={order.paymentStatus} /><div className="flex flex-wrap justify-end gap-2"><Button variant="ghost" disabled={buyAgain.isPending} onClick={() => buyAgain.mutate(order.id)}>Mua lại</Button><Button asChild variant="outline"><Link href={`/orders/${order.id}`}>Chi tiết</Link></Button>{canCancelOrder(order.status) ? <ConfirmDialog trigger={<Button variant="destructive" disabled={cancel.isPending}>Hủy đơn</Button>} title="Hủy đơn hàng?" description="Đơn hàng sẽ bị hủy và không thể khôi phục." confirmLabel="Hủy đơn" onConfirm={() => cancel.mutate(order.id)} /> : null}</div></div></article>)}</div><Pagination page={orders.data.meta.page} totalPages={orders.data.meta.totalPages} onPageChange={setPage} /></>}</section>;
}

function OrderListSkeleton() { return <div className="space-y-4">{Array.from({ length: 3 }, (_, index) => <div key={index} className="rounded-2xl border bg-card p-5"><Skeleton className="h-5 w-40" /><Skeleton className="mt-3 h-4 w-64" /><Skeleton className="mt-5 h-16 w-full" /></div>)}</div>; }
function OrderListError() { return <EmptyState title="Không thể tải đơn hàng" description="Vui lòng kiểm tra kết nối và thử lại." action={<Button onClick={() => window.location.reload()}>Tải lại</Button>} />; }
function OrderThumbnail({ url, name }: { url?: string; name: string }) { if (!url) return <div className="h-14 w-14 shrink-0 rounded-lg bg-muted" />; // eslint-disable-next-line @next/next/no-img-element
return <img src={url} alt={name} className="h-14 w-14 shrink-0 rounded-lg border object-cover" />; }
