import { CheckCircle2, Circle, Truck, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { OrderStatus, OrderStatusLog, PaymentStatus } from '@/types/order';

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  READY_FOR_PICKUP: 'Chờ lấy hàng',
  OUT_FOR_DELIVERY: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Chờ thanh toán',
  SUCCESS: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

const workflow: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant = status === 'CANCELLED' ? 'destructive' : status === 'DELIVERED' ? 'default' : 'secondary';
  return <Badge variant={variant}>{orderStatusLabels[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const variant = status === 'FAILED' || status === 'REFUNDED' ? 'destructive' : status === 'SUCCESS' ? 'default' : 'secondary';
  return <Badge variant={variant}>{paymentStatusLabels[status]}</Badge>;
}

export function canCancelOrder(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'CONFIRMED';
}

export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const index = workflow.indexOf(status);
  return index < 0 || index === workflow.length - 1 ? null : workflow[index + 1];
}

export function OrderTimeline({ logs, status }: { logs: OrderStatusLog[]; status: OrderStatus }) {
  if (status === 'CANCELLED') {
    const cancelled = logs.find((log) => log.newStatus === 'CANCELLED');
    return <ol className="space-y-3"><TimelineItem status="PENDING" log={logs.find((log) => log.newStatus === 'PENDING')} complete /><TimelineItem status="CANCELLED" log={cancelled} complete cancelled /></ol>;
  }

  const currentIndex = workflow.indexOf(status);
  return <ol className="space-y-3">
    {workflow.map((item, index) => <TimelineItem key={item} status={item} log={logs.find((log) => log.newStatus === item)} complete={index <= currentIndex} />)}
  </ol>;
}

function TimelineItem({ status, log, complete, cancelled = false }: { status: OrderStatus; log?: OrderStatusLog; complete: boolean; cancelled?: boolean }) {
  const Icon = cancelled ? XCircle : complete ? status === 'OUT_FOR_DELIVERY' ? Truck : CheckCircle2 : Circle;
  return <li className="flex gap-3"><Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cancelled ? 'text-destructive' : complete ? 'text-primary' : 'text-muted-foreground'}`} /><div><p className={`text-sm font-medium ${complete ? '' : 'text-muted-foreground'}`}>{status === 'PENDING' ? 'Đơn hàng được tạo' : orderStatusLabels[status]}</p>{log ? <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString('vi-VN')}{log.changedBy?.fullName ? ` · ${log.changedBy.fullName}` : ''}</p> : null}</div></li>;
}
