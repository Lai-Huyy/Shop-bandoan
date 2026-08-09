'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Gift, PackageCheck, TicketCheck, TicketX } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DateTimePicker } from '@/components/forms/date-time-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { categoriesService } from '@/services/categories.service';
import { couponsService } from '@/services/coupons.service';
import type { Coupon } from '@/types/coupon';

interface CouponForm {
  code: string;
  description: string;
  discountType: 'FIXED_AMOUNT' | 'PERCENTAGE';
  discountValue: string;
  minOrderSubtotal: string;
  couponQuantity: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const emptyForm: CouponForm = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minOrderSubtotal: '0',
  couponQuantity: '',
  categoryId: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

function toLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function price(value: string | number) {
  return `${Number(value).toLocaleString('vi-VN')} ₫`;
}

export default function AdminCouponsPage() {
  const client = useQueryClient();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const coupons = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => couponsService.list({ page: 1, limit: 100 }),
  });
  const analytics = useQuery({
    queryKey: ['coupon-analytics'],
    queryFn: couponsService.getAnalytics,
  });
  const categories = useQuery({
    queryKey: ['categories', 'coupon-form'],
    queryFn: () => categoriesService.list({ page: 1, limit: 100 }),
  });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['admin-coupons'] });
    void client.invalidateQueries({ queryKey: ['coupon-analytics'] });
  };
  const save = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      editing
        ? couponsService.update(editing.id, data)
        : couponsService.create(data),
    onSuccess: () => {
      toast.success(
        editing ? 'Đã cập nhật mã giảm giá.' : 'Đã tạo mã giảm giá.',
      );
      setEditing(null);
      setForm(emptyForm);
      refresh();
    },
    onError: () =>
      toast.error(
        'Không thể lưu mã giảm giá. Vui lòng kiểm tra lại thông tin.',
      ),
  });
  const remove = useMutation({
    mutationFn: couponsService.remove,
    onSuccess: () => {
      toast.success('Mã giảm giá đã được ngừng hoạt động.');
      refresh();
    },
    onError: () => toast.error('Không thể ngừng hoạt động mã giảm giá.'),
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.startDate || !form.endDate) {
      toast.error('Vui lòng chọn thời gian bắt đầu và kết thúc.');
      return;
    }
    save.mutate({
      code: form.code.trim(),
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue: form.discountValue,
      minOrderSubtotal: form.minOrderSubtotal || '0',
      couponQuantity: Number(form.couponQuantity),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      isActive: form.isActive,
    });
  };

  const edit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description ?? '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderSubtotal: coupon.minOrderSubtotal,
      couponQuantity: coupon.couponQuantity?.toString() ?? '',
      categoryId: coupon.categoryId?.toString() ?? '',
      startDate: toLocalDateTime(coupon.startDate),
      endDate: toLocalDateTime(coupon.endDate),
      isActive: coupon.isActive,
    });
  };

  const statisticCards = [
    {
      label: 'Mã đã tạo',
      value: analytics.data?.couponsCreated ?? 0,
      icon: Gift,
    },
    {
      label: 'Đã nhận',
      value: analytics.data?.couponsClaimed ?? 0,
      icon: TicketCheck,
    },
    {
      label: 'Đã sử dụng',
      value: analytics.data?.couponsUsed ?? 0,
      icon: PackageCheck,
    },
    {
      label: 'Còn lại',
      value: analytics.data?.remainingCoupons ?? 0,
      icon: BarChart3,
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-orange-600">Quản trị</p>
        <h1 className="text-3xl font-bold">Mã giảm giá</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statisticCards.map(({ icon: Icon, label, value }) => (
          <article
            key={label}
            className="rounded-2xl border bg-card p-4 shadow-sm"
          >
            <Icon className="h-5 w-5 text-orange-600" />
            <p className="mt-4 text-2xl font-bold">
              {analytics.isLoading ? '—' : value}
            </p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </article>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <h2 className="font-semibold">
            {editing ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mỗi người chỉ có thể nhận và dùng một mã một lần.
          </p>
        </div>
        <Input
          required
          value={form.code}
          onChange={(event) =>
            setForm({ ...form, code: event.target.value.toUpperCase() })
          }
          placeholder="Mã giảm giá"
          maxLength={50}
        />
        <select
          value={form.discountType}
          onChange={(event) =>
            setForm({
              ...form,
              discountType: event.target.value as CouponForm['discountType'],
            })
          }
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="PERCENTAGE">Giảm phần trăm</option>
          <option value="FIXED_AMOUNT">Giảm số tiền</option>
        </select>
        <Input
          required
          type="number"
          min="0.01"
          max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
          step="0.01"
          value={form.discountValue}
          onChange={(event) =>
            setForm({ ...form, discountValue: event.target.value })
          }
          placeholder={
            form.discountType === 'PERCENTAGE'
              ? 'Phần trăm giảm'
              : 'Số tiền giảm'
          }
        />
        <Input
          required
          type="number"
          min="0"
          step="1000"
          value={form.minOrderSubtotal}
          onChange={(event) =>
            setForm({ ...form, minOrderSubtotal: event.target.value })
          }
          placeholder="Giá trị đơn tối thiểu"
        />
        <select
          value={form.categoryId}
          onChange={(event) =>
            setForm({ ...form, categoryId: event.target.value })
          }
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tất cả danh mục</option>
          {categories.data?.items.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <Input
          required
          type="number"
          min="1"
          step="1"
          value={form.couponQuantity}
          onChange={(event) =>
            setForm({ ...form, couponQuantity: event.target.value })
          }
          placeholder="Số lượng mã giảm giá"
          aria-label="Tổng số mã người dùng có thể nhận"
        />
        <DateTimePicker
          id="coupon-start"
          label="Bắt đầu"
          value={form.startDate}
          onChange={(startDate) => setForm({ ...form, startDate })}
          required
        />
        <DateTimePicker
          id="coupon-end"
          label="Kết thúc"
          value={form.endDate}
          onChange={(endDate) => setForm({ ...form, endDate })}
          required
          min={form.startDate || undefined}
        />
        <Textarea
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          placeholder="Mô tả điều kiện của mã giảm giá"
          className="md:col-span-2"
        />
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) =>
              setForm({ ...form, isActive: event.target.checked })
            }
          />
          Đang hoạt động
        </label>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button disabled={save.isPending}>
            {save.isPending ? 'Đang lưu...' : 'Lưu mã giảm giá'}
          </Button>
          {editing ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
              }}
            >
              Hủy
            </Button>
          ) : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="min-w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              {[
                'Mã',
                'Giảm giá',
                'Đơn tối thiểu',
                'Tổng số mã',
                'Còn lại',
                'Đã nhận',
                'Đã dùng',
                'Trạng thái',
                '',
              ].map((label) => (
                <th key={label} className="px-4 py-3 font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coupons.data?.items.map((coupon) => (
              <tr key={coupon.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-semibold">{coupon.code}</td>
                <td className="px-4 py-3">
                  {coupon.discountType === 'PERCENTAGE'
                    ? `${coupon.discountValue}%`
                    : price(coupon.discountValue)}
                </td>
                <td className="px-4 py-3">{price(coupon.minOrderSubtotal)}</td>
                <td className="px-4 py-3">
                  {coupon.couponQuantity ?? 'Không giới hạn'}
                </td>
                <td className="px-4 py-3">{coupon.remainingQuantity ?? '—'}</td>
                <td className="px-4 py-3">{coupon.claimedCount ?? 0}</td>
                <td className="px-4 py-3">{coupon.usedCount ?? 0}</td>
                <td className="px-4 py-3">
                  {coupon.isActive ? 'Hoạt động' : 'Đã tắt'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => edit(coupon)}
                  >
                    Sửa
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button
                        size="sm"
                        variant="destructive"
                        className="ml-2"
                        disabled={remove.isPending}
                      >
                        Tắt
                      </Button>
                    }
                    title="Ngừng hoạt động mã giảm giá"
                    description={`Mã “${coupon.code}” sẽ không còn khả dụng cho khách hàng.`}
                    icon={TicketX}
                    confirmLabel="Ngừng hoạt động"
                    isLoading={remove.isPending}
                    onConfirm={() => remove.mutateAsync(coupon.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
