'use client';

import { useQuery } from '@tanstack/react-query';
import { couponsService } from '@/services/coupons.service';

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

export function WalletReply({
  userId,
  intro,
}: {
  userId: string;
  intro: string;
}) {
  const wallet = useQuery({
    queryKey: ['my-coupons', 'chat', userId],
    queryFn: () => couponsService.getMine({ page: 1, limit: 100 }),
    refetchOnMount: 'always',
  });
  if (wallet.isError)
    return (
      <p>
        Chưa tải được ví voucher.{' '}
        <button
          type="button"
          className="underline"
          onClick={() => void wallet.refetch()}
        >
          Thử lại
        </button>
      </p>
    );
  if (wallet.isFetching || !wallet.data)
    return <p>Đang kiểm tra ví voucher…</p>;

  const now = Date.now();
  const available = wallet.data.items.filter(
    ({ status, usedAt, coupon }) =>
      status === 'AVAILABLE' &&
      !usedAt &&
      coupon.isActive &&
      Date.parse(coupon.startDate) <= now &&
      now <= Date.parse(coupon.endDate),
  );
  if (!available.length)
    return <p>Ví của bạn hiện chưa có voucher còn dùng được.</p>;
  return (
    <div>
      <p>{intro}</p>
      <ul className="mt-2 space-y-2">
        {available.map(({ id, coupon }) => (
          <li key={id} className="rounded-xl border p-3">
            <strong>{coupon.code}</strong> · Giảm{' '}
            {coupon.discountType === 'PERCENTAGE'
              ? coupon.discountValue + '%'
              : money.format(Number(coupon.discountValue))}
            <p className="text-sm">
              Đơn từ {money.format(Number(coupon.minOrderSubtotal))} ·{' '}
              {coupon.category?.name ??
                (coupon.categoryId == null ? 'Toàn cửa hàng' : 'Theo danh mục')}
            </p>
            <p className="text-sm">
              Hạn dùng: {new Date(coupon.endDate).toLocaleString('vi-VN')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
