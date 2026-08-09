'use client';

import { Check, Ticket } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { CheckoutCouponOption } from '@/types/coupon';

function currency(value: string) {
  return `${Number(value).toLocaleString('vi-VN')} ₫`;
}

function discount(option: CheckoutCouponOption) {
  return option.discountType === 'PERCENTAGE'
    ? `Giảm ${option.discountValue}%`
    : `Giảm ${currency(option.discountValue)}`;
}

export function CheckoutCouponSelector({
  options,
  selectedId,
  isLoading,
  onSelect,
  onClear,
}: {
  options: CheckoutCouponOption[];
  selectedId: string | undefined;
  isLoading: boolean;
  onSelect(option: CheckoutCouponOption): void;
  onClear(): void;
}) {
  const selected = options.find(
    (option) => option.couponClaimId === selectedId,
  );
  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-orange-600" />
            <h2 className="font-semibold">Mã giảm giá</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Chỉ hiển thị các mã bạn đã nhận và chưa dùng.
          </p>
        </div>
        <CouponDialog
          options={options}
          selectedId={selectedId}
          isLoading={isLoading}
          onSelect={onSelect}
        />
      </div>
      {selected ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-orange-500/10 p-3">
          <div>
            <p className="font-semibold text-orange-700 dark:text-orange-300">
              {selected.code} · {discount(selected)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Giảm {currency(selected.discountAmount)} cho{' '}
              {selected.appliedProductName}.
            </p>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Bỏ chọn
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Bạn chưa chọn mã giảm giá.
        </p>
      )}
    </section>
  );
}

function CouponDialog({
  options,
  selectedId,
  isLoading,
  onSelect,
}: {
  options: CheckoutCouponOption[];
  selectedId: string | undefined;
  isLoading: boolean;
  onSelect(option: CheckoutCouponOption): void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Chọn mã
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle>Chọn mã giảm giá</DialogTitle>
        <DialogDescription>
          Mã tốt nhất cho đơn hàng hiện tại được xếp đầu tiên.
        </DialogDescription>
        <div className="mt-5 space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </>
          ) : null}
          {!isLoading && !options.length ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Bạn chưa có mã giảm giá phù hợp để sử dụng.
            </p>
          ) : null}
          {options.map((option) => (
            <button
              key={option.couponClaimId}
              type="button"
              disabled={!option.isApplicable}
              onClick={() => {
                if (option.isApplicable) {
                  onSelect(option);
                  setOpen(false);
                }
              }}
              className={`w-full rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-55 ${option.couponClaimId === selectedId ? 'border-orange-500 bg-orange-500/10' : 'hover:border-orange-300 hover:bg-muted/40'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {option.code} · {discount(option)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Đơn tối thiểu {currency(option.minOrderSubtotal)} · Hết hạn{' '}
                    {new Date(option.endDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                {option.couponClaimId === selectedId ? (
                  <Check className="h-5 w-5 shrink-0 text-orange-600" />
                ) : (
                  <Badge
                    variant={option.isApplicable ? 'default' : 'secondary'}
                  >
                    {option.isApplicable
                      ? `Giảm ${currency(option.discountAmount)}`
                      : 'Chưa áp dụng được'}
                  </Badge>
                )}
              </div>
              {option.isApplicable ? (
                <p className="mt-3 text-sm text-emerald-600">
                  Giảm {currency(option.discountAmount)} cho{' '}
                  {option.appliedProductName}.
                </p>
              ) : (
                <p className="mt-3 text-sm text-destructive">{option.reason}</p>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
