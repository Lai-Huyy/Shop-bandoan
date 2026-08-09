'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { Coupon } from '@/types/coupon';
import { couponsService } from '@/services/coupons.service';
import { Reveal } from './reveal';

function formatDiscount(coupon: Coupon): string {
  const value = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(Number(coupon.discountValue));
  return coupon.discountType === 'PERCENTAGE'
    ? `Giảm ${value}%`
    : `Giảm ${value} ₫`;
}

function formatMinimum(value: string): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

interface HomeCouponsProps {
  coupons?: Coupon[];
}

export function HomeCoupons({ coupons }: HomeCouponsProps) {
  const queryClient = useQueryClient();
  const claimCoupon = useMutation({
    mutationFn: couponsService.claim,
    onSuccess: () => {
      toast.success('Đã nhận mã giảm giá.');
      void queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: () => toast.error('Không thể nhận mã giảm giá. Vui lòng thử lại.'),
  });

  if (!coupons?.length) return null;

  return (
    <section
      id="uu-dai"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <Reveal>
        <div className="rounded-[2rem] bg-gradient-to-br from-[#071426] via-[#102b4d] to-[#071426] px-6 py-8 text-white shadow-2xl shadow-slate-950/15 sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold tracking-[0.16em] text-orange-300">
                <Sparkles className="h-4 w-4" /> ƯU ĐÃI DÀNH CHO BẠN
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                Mã giảm giá đang có
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Nhận mã trực tiếp vào ví ưu đãi của bạn để dùng khi thanh toán.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/coupons">Xem tất cả</Link>
            </Button>
          </div>
          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {coupons.slice(0, 6).map((coupon) => (
              <article
                key={coupon.id}
                className="min-w-[17rem] snap-start rounded-2xl bg-white p-5 text-slate-950 shadow-lg sm:min-w-[19rem]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-black text-orange-600">
                      {formatDiscount(coupon)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Đơn tối thiểu {formatMinimum(coupon.minOrderSubtotal)}
                    </p>
                  </div>
                  <span className="rounded-lg bg-orange-50 p-2 text-orange-600">
                    <Copy className="h-4 w-4" />
                  </span>
                </div>
                <div className="my-4 border-t border-dashed border-slate-200" />
                <p className="font-mono text-sm font-black tracking-wide">
                  {coupon.code}
                </p>
                <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
                  {coupon.description ??
                    'Áp dụng theo điều kiện của mã giảm giá.'}
                </p>
                <Button
                  type="button"
                  disabled={coupon.hasClaimed || claimCoupon.isPending}
                  onClick={() => claimCoupon.mutate(coupon.id)}
                  className="mt-4 w-full rounded-xl bg-orange-500 hover:bg-orange-600"
                >
                  {coupon.hasClaimed ? (
                    <>
                      <Check className="h-4 w-4" />
                      Đã nhận
                    </>
                  ) : (
                    'Nhận mã'
                  )}
                </Button>
              </article>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
