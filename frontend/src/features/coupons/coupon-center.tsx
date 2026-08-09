'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { couponsService } from '@/services/coupons.service';
import type { Coupon, CouponClaim } from '@/types/coupon';

function currency(value: string) {
  return `${Number(value).toLocaleString('vi-VN')} ₫`;
}

function discount(coupon: Coupon) {
  return coupon.discountType === 'PERCENTAGE'
    ? `Giảm ${coupon.discountValue}%`
    : `Giảm ${currency(coupon.discountValue)}`;
}

function expiry(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function CouponCenter() {
  const [tab, setTab] = useState<'available' | 'mine'>('available');
  const client = useQueryClient();
  const available = useQuery({
    queryKey: ['available-coupons'],
    queryFn: () => couponsService.getAvailable({ page: 1, limit: 100 }),
    enabled: tab === 'available',
  });
  const mine = useQuery({
    queryKey: ['my-coupons'],
    queryFn: () => couponsService.getMine({ page: 1, limit: 10 }),
    enabled: tab === 'mine',
  });
  const claim = useMutation({
    mutationFn: couponsService.claim,
    onSuccess: () => {
      toast.success('Đã lưu mã giảm giá vào kho phiếu của bạn.');
      void client.invalidateQueries({ queryKey: ['available-coupons'] });
      void client.invalidateQueries({ queryKey: ['my-coupons'] });
    },
    onError: () =>
      toast.error(
        'Không thể nhận mã. Mã có thể đã hết hoặc bạn đã nhận trước đó.',
      ),
  });

  const isLoading = tab === 'available' ? available.isLoading : mine.isLoading;
  const error = tab === 'available' ? available.error : mine.error;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-orange-600">
          Ưu đãi dành cho bạn
        </p>
        <h1 className="mt-1 text-3xl font-bold">Kho mã giảm giá</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bạn có thể lưu tối đa 10 mã. Mỗi mã chỉ dùng được một lần.
        </p>
      </div>
      <div
        className="flex gap-2 border-b"
        role="tablist"
        aria-label="Danh sách mã giảm giá"
      >
        <Button
          type="button"
          variant={tab === 'available' ? 'default' : 'ghost'}
          onClick={() => setTab('available')}
          role="tab"
          aria-selected={tab === 'available'}
        >
          Mã có thể nhận
        </Button>
        <Button
          type="button"
          variant={tab === 'mine' ? 'default' : 'ghost'}
          onClick={() => setTab('mine')}
          role="tab"
          aria-selected={tab === 'mine'}
        >
          Mã của tôi
        </Button>
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : null}
      {error ? (
        <EmptyState
          title="Không thể tải mã giảm giá"
          description="Vui lòng thử lại sau."
          action={
            <Button
              onClick={() =>
                tab === 'available' ? available.refetch() : mine.refetch()
              }
            >
              Tải lại
            </Button>
          }
        />
      ) : null}
      {!isLoading && !error && tab === 'available' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {available.data?.items.map((coupon) => (
            <AvailableCouponCard
              key={coupon.id}
              coupon={coupon}
              busy={claim.isPending}
              onClaim={() => claim.mutate(coupon.id)}
            />
          ))}
        </div>
      ) : null}
      {!isLoading &&
      !error &&
      tab === 'available' &&
      !available.data?.items.length ? (
        <EmptyState
          title="Chưa có mã giảm giá"
          description="Các ưu đãi mới sẽ xuất hiện tại đây."
        />
      ) : null}
      {!isLoading && !error && tab === 'mine' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mine.data?.items.map((claimItem) => (
            <ClaimedCouponCard key={claimItem.id} claim={claimItem} />
          ))}
        </div>
      ) : null}
      {!isLoading && !error && tab === 'mine' && !mine.data?.items.length ? (
        <EmptyState
          title="Bạn chưa có mã giảm giá"
          description="Hãy nhận mã ưu đãi để sử dụng khi thanh toán."
          action={
            <Button onClick={() => setTab('available')}>
              Xem mã có thể nhận
            </Button>
          }
        />
      ) : null}
    </section>
  );
}

function AvailableCouponCard({
  coupon,
  busy,
  onClaim,
}: {
  coupon: Coupon;
  busy: boolean;
  onClaim(): void;
}) {
  const unavailable = coupon.hasClaimed || (coupon.remainingQuantity ?? 1) <= 0;
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-xl bg-orange-500/10 p-2 text-orange-600">
          <Ticket className="h-5 w-5" />
        </div>
        <Badge variant="outline">
          {coupon.category?.name ?? 'Toàn cửa hàng'}
        </Badge>
      </div>
      <h2 className="mt-5 text-xl font-bold">{discount(coupon)}</h2>
      <p className="mt-1 font-mono text-sm font-semibold text-orange-600">
        {coupon.code}
      </p>
      <p className="mt-3 min-h-10 text-sm text-muted-foreground">
        {coupon.description ?? 'Ưu đãi áp dụng theo điều kiện của cửa hàng.'}
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Đơn tối thiểu</dt>
          <dd>{currency(coupon.minOrderSubtotal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Hết hạn</dt>
          <dd className="text-right">{expiry(coupon.endDate)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Số mã còn lại</dt>
          <dd>{coupon.remainingQuantity ?? 'Không giới hạn'}</dd>
        </div>
      </dl>
      <Button
        className="mt-5 w-full"
        disabled={unavailable || busy}
        onClick={onClaim}
      >
        {coupon.hasClaimed ? 'Đã nhận' : busy ? 'Đang nhận...' : 'Nhận mã'}
      </Button>
    </article>
  );
}

function ClaimedCouponCard({ claim }: { claim: CouponClaim }) {
  const labels = {
    AVAILABLE: 'Có thể sử dụng',
    USED: 'Đã sử dụng',
    EXPIRED: 'Đã hết hạn',
    INACTIVE: 'Không khả dụng',
  } as const;
  const icon =
    claim.status === 'USED' ? (
      <CheckCircle2 className="h-5 w-5" />
    ) : (
      <Clock3 className="h-5 w-5" />
    );
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-xl bg-orange-500/10 p-2 text-orange-600">
          {icon}
        </div>
        <Badge variant={claim.status === 'AVAILABLE' ? 'default' : 'secondary'}>
          {labels[claim.status]}
        </Badge>
      </div>
      <h2 className="mt-5 text-xl font-bold">{discount(claim.coupon)}</h2>
      <p className="mt-1 font-mono text-sm font-semibold text-orange-600">
        {claim.coupon.code}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Đơn tối thiểu: {currency(claim.coupon.minOrderSubtotal)}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Hết hạn: {expiry(claim.coupon.endDate)}
      </p>
      {claim.usedAt ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Đã dùng: {expiry(claim.usedAt)}
        </p>
      ) : null}
    </article>
  );
}
