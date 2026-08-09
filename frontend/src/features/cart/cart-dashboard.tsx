'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cartService } from '@/services/cart.service';
import type { CartItem } from '@/types/cart';

function toAmount(value: string) {
  return Number(value);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function CartRow({
  item,
  checked,
  onCheckedChange,
  onUpdateQuantity,
  onRemove,
  isUpdating,
}: {
  item: CartItem;
  checked: boolean;
  onCheckedChange(): void;
  onUpdateQuantity(quantity: number): void;
  onRemove(): Promise<unknown>;
  isUpdating: boolean;
}) {
  return (
    <article className="grid grid-cols-[auto_72px_1fr_auto] items-center gap-3 border-b p-4 last:border-b-0 sm:grid-cols-[auto_96px_1fr_auto_auto]">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} aria-label={`Chọn ${item.product.name}`} />
      <div className="h-16 w-[72px] overflow-hidden rounded-lg bg-muted sm:h-20 sm:w-24">
        {item.product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0">
        <h2 className="line-clamp-2 font-semibold">{item.product.name}</h2>
        {item.selectedOptions?.length ? (
          <p className="mt-1 text-sm text-muted-foreground">{item.selectedOptions.join(' · ')}</p>
        ) : null}
        <p className="mt-2 text-sm font-medium sm:hidden">{formatPrice(toAmount(item.unitPrice))}</p>
      </div>
      <div className="hidden text-sm font-medium sm:block">{formatPrice(toAmount(item.unitPrice))}</div>
      <div className="col-start-3 flex items-center gap-2 sm:col-start-auto">
        <Button size="icon" variant="outline" onClick={() => onUpdateQuantity(item.quantity - 1)} disabled={isUpdating || item.quantity <= 1} aria-label="Giảm số lượng">
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
        <Button size="icon" variant="outline" onClick={() => onUpdateQuantity(item.quantity + 1)} disabled={isUpdating || item.quantity >= item.product.stockQuantity} aria-label="Tăng số lượng">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {item.quantity >= item.product.stockQuantity ? <p className="col-span-full text-xs text-amber-600">Đã đạt số lượng tồn kho hiện có ({item.product.stockQuantity}).</p> : null}
      <div className="col-start-3 flex items-center justify-between sm:col-start-auto sm:block">
        <p className="font-semibold text-orange-600">{formatPrice(toAmount(item.lineTotal))}</p>
        <ConfirmDialog
          trigger={
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isUpdating}
              aria-label={`Xóa ${item.product.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          }
          title="Xóa sản phẩm khỏi giỏ hàng"
          description={`Bạn có chắc muốn xóa “${item.product.name}” khỏi giỏ hàng không?`}
          icon={Trash2}
          confirmLabel="Xóa sản phẩm"
          isLoading={isUpdating}
          onConfirm={onRemove}
        />
      </div>
    </article>
  );
}

export function CartDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { data: cart, error, isLoading, refetch } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.get,
  });

  useEffect(() => {
    if (cart) {
      setSelectedIds((current) => {
        const validIds = current.filter((id) => cart.items.some((item) => item.id === id));
        return current.length ? validIds : cart.items.map((item) => item.id);
      });
    }
  }, [cart]);

  const updateItem = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartService.updateItem(itemId, quantity),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => toast.error('Không thể cập nhật số lượng sản phẩm.'),
  });
  const removeItem = useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onSuccess: () => {
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng.');
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => toast.error('Không thể xóa sản phẩm khỏi giỏ hàng.'),
  });
  const removeSelected = useMutation({
    mutationFn: async (itemIds: string[]) => Promise.all(itemIds.map((itemId) => cartService.removeItem(itemId))),
    onSuccess: () => {
      toast.success('Đã xóa các sản phẩm đã chọn.');
      setSelectedIds([]);
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => toast.error('Không thể xóa một số sản phẩm đã chọn.'),
  });

  const selectedItems = useMemo(
    () => cart?.items.filter((item) => selectedIds.includes(item.id)) ?? [],
    [cart?.items, selectedIds],
  );
  const subtotal = useMemo(
    () => selectedItems.reduce((total, item) => total + toAmount(item.lineTotal), 0),
    [selectedItems],
  );
  const allSelected = Boolean(cart?.items.length) && selectedIds.length === cart?.items.length;

  if (isLoading) {
    return <Skeleton className="h-[32rem] rounded-2xl" />;
  }
  if (error) {
    return <ErrorState message="Không thể tải giỏ hàng." retry={() => void refetch()} />;
  }
  if (!cart?.items.length) {
    return (
      <EmptyState
        title="Giỏ hàng của bạn đang trống"
        description="Hãy chọn các món bạn yêu thích để bắt đầu mua sắm."
        action={<Button asChild><Link href="/products">Tiếp tục mua sắm</Link></Button>}
      />
    );
  }

  const toggleOne = (itemId: string) => {
    setSelectedIds((current) => current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]);
  };
  const toggleAll = () => setSelectedIds(allSelected ? [] : cart.items.map((item) => item.id));
  const checkout = () => router.push(`/checkout?items=${selectedIds.join(',')}`);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-orange-600">Giỏ hàng</p>
          <h1 className="mt-1 text-3xl font-bold">Sản phẩm đã chọn</h1>
        </div>
        <p className="text-sm text-muted-foreground">Đã chọn: {selectedItems.length} / {cart.items.length} sản phẩm</p>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Chọn tất cả sản phẩm" />
              Chọn tất cả
            </label>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={!selectedIds.length || removeSelected.isPending}>
                  <Trash2 className="h-4 w-4" /> Xóa đã chọn
                </Button>
              }
              title="Xóa sản phẩm đã chọn?"
              description={`Bạn sắp xóa ${selectedIds.length} sản phẩm khỏi giỏ hàng.`}
              confirmLabel="Xóa sản phẩm"
              isLoading={removeSelected.isPending}
              onConfirm={() => removeSelected.mutateAsync(selectedIds)}
            />
          </div>
          {cart.items.map((item) => (
            <CartRow key={item.id} item={item} checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleOne(item.id)} onUpdateQuantity={(quantity) => updateItem.mutate({ itemId: item.id, quantity })} onRemove={() => removeItem.mutateAsync(item.id)} isUpdating={updateItem.isPending || removeItem.isPending} />
          ))}
        </div>
        <aside className="h-fit rounded-2xl border bg-card p-5 shadow-sm xl:sticky xl:top-24">
          <h2 className="text-lg font-semibold">Tóm tắt đơn hàng</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sản phẩm đã chọn</span><span>{selectedItems.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Giảm giá</span><span>{formatPrice(0)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phí giao hàng</span><span>{formatPrice(0)}</span></div>
            <div className="flex justify-between border-t pt-3 text-base font-bold"><span>Tổng ước tính</span><span className="text-orange-600">{formatPrice(subtotal)}</span></div>
          </div>
          <Button className="mt-6 w-full" disabled={!selectedIds.length} onClick={checkout}>
            <ShoppingBag className="h-4 w-4" /> Thanh toán
          </Button>
        </aside>
      </div>
    </section>
  );
}
