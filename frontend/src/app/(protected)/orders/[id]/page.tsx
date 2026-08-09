'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderDetail } from '@/features/orders/order-detail';
import { ordersService } from '@/services/orders.service';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const order = useQuery({ queryKey: ['order', id], queryFn: () => ordersService.detail(id) });

  if (order.isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-48 w-full" /><Skeleton className="h-80 w-full" /></div>;
  if (order.error || !order.data) return <EmptyState title="Không tìm thấy đơn hàng" description="Đơn hàng không tồn tại hoặc không thuộc tài khoản của bạn." action={<Button asChild><Link href="/orders">Quay lại đơn hàng</Link></Button>} />;

  return <section className="space-y-5"><Button asChild variant="ghost" className="-ml-3"><Link href="/orders"><ArrowLeft className="mr-2 h-4 w-4" />Đơn hàng của tôi</Link></Button><OrderDetail order={order.data} /></section>;
}
