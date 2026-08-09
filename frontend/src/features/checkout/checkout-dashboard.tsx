'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cartService } from '@/services/cart.service';
import { checkoutService } from '@/services/checkout.service';
import { productsService } from '@/services/products.service';
import { couponsService } from '@/services/coupons.service';
import { AddressForm } from '@/features/addresses/address-form';
import { AddressSelectorDialog } from '@/features/addresses/address-selector-dialog';
import { CheckoutCouponSelector } from '@/features/coupons/checkout-coupon-selector';

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function CheckoutDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const directProductId = searchParams.get('productId');
  const directRequestedQuantity = Math.min(
    100,
    Math.max(1, Number(searchParams.get('quantity')) || 1),
  );
  const directOptions = searchParams.getAll('option');
  const cartItemIds = useMemo(
    () => (searchParams.get('items') ?? '').split(',').filter(Boolean),
    [searchParams],
  );
  const isDirectCheckout = Boolean(directProductId);
  const [addressId, setAddressId] = useState('');
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [savingFirstAddress, setSavingFirstAddress] = useState(false);
  const [couponClaimId, setCouponClaimId] = useState<string>();

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: checkoutService.getAddresses,
  });
  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.get,
    enabled: !isDirectCheckout && cartItemIds.length > 0,
  });
  const productQuery = useQuery({
    queryKey: ['product', directProductId],
    queryFn: () => productsService.getById(directProductId as string),
    enabled: isDirectCheckout,
  });
  const directQuantity = Math.min(
    directRequestedQuantity,
    productQuery.data?.stockQuantity ?? directRequestedQuantity,
  );

  useEffect(() => {
    if (!addressId && addressesQuery.data?.length) {
      setAddressId(
        addressesQuery.data.find((address) => address.isDefault)?.id ??
          addressesQuery.data[0].id,
      );
    }
  }, [addressId, addressesQuery.data]);

  const cartItems = useMemo(
    () =>
      cartQuery.data?.items.filter((item) => cartItemIds.includes(item.id)) ??
      [],
    [cartItemIds, cartQuery.data?.items],
  );
  const cartSelectionIsValid = cartItems.length === cartItemIds.length;
  const selectedAddress = addressesQuery.data?.find(
    (address) => address.id === addressId,
  );
  const subtotal = isDirectCheckout
    ? Number(productQuery.data?.basePrice ?? 0) * directQuantity
    : cartItems.reduce((total, item) => total + Number(item.lineTotal), 0);
  const couponOptions = useQuery({
    queryKey: [
      'checkout-coupon-options',
      directProductId,
      directQuantity,
      cartItemIds,
    ],
    queryFn: () =>
      couponsService.checkoutOptions(
        isDirectCheckout
          ? { directProductId: directProductId as string, directQuantity }
          : { cartItemIds },
      ),
    enabled: isDirectCheckout
      ? Boolean(productQuery.data)
      : cartSelectionIsValid && cartItems.length > 0,
  });
  useEffect(() => {
    if (
      couponClaimId &&
      !couponOptions.data?.some(
        (option) =>
          option.couponClaimId === couponClaimId && option.isApplicable,
      )
    ) {
      setCouponClaimId(undefined);
    }
  }, [couponClaimId, couponOptions.data]);
  const appliedCoupon = couponOptions.data?.find(
    (option) => option.couponClaimId === couponClaimId && option.isApplicable,
  );
  const discountAmount = Number(appliedCoupon?.discountAmount ?? 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const checkout = useMutation({
    mutationFn: () =>
      checkoutService.checkout({
        addressId,
        ...(appliedCoupon
          ? { couponClaimId: appliedCoupon.couponClaimId }
          : {}),
        ...(isDirectCheckout
          ? {
              directItem: {
                productId: directProductId as string,
                quantity: directQuantity,
                selectedOptions: directOptions,
              },
            }
          : { cartItemIds }),
      }),
    onSuccess: () => {
      toast.success('Đặt hàng thành công.');
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      router.replace('/orders');
    },
    onError: () =>
      toast.error('Không thể đặt hàng. Vui lòng kiểm tra lại thông tin.'),
  });
  const saveFirstAddress = async (
    data: Parameters<typeof checkoutService.createAddress>[0],
  ) => {
    setSavingFirstAddress(true);
    try {
      const address = await checkoutService.createAddress({
        ...data,
        isDefault: data.isDefault ?? true,
      });
      await addressesQuery.refetch();
      setAddressId(address.id);
      toast.success('Đã lưu địa chỉ giao hàng.');
    } catch {
      toast.error('Không thể lưu địa chỉ.');
    } finally {
      setSavingFirstAddress(false);
    }
  };

  const isLoading =
    addressesQuery.isLoading ||
    (isDirectCheckout ? productQuery.isLoading : cartQuery.isLoading);
  if (isLoading) {
    return <Skeleton className="h-[32rem] rounded-2xl" />;
  }
  if (addressesQuery.error || productQuery.error || cartQuery.error) {
    return (
      <ErrorState
        message="Không thể tải thông tin thanh toán."
        retry={() => {
          void addressesQuery.refetch();
          void productQuery.refetch();
          void cartQuery.refetch();
        }}
      />
    );
  }
  if (!isDirectCheckout && !cartItemIds.length) {
    return (
      <EmptyState
        title="Chưa có sản phẩm để thanh toán"
        description="Hãy chọn sản phẩm trong giỏ hàng trước khi tiếp tục."
        action={
          <Button asChild>
            <Link href="/cart">Đến giỏ hàng</Link>
          </Button>
        }
      />
    );
  }
  if (isDirectCheckout && !productQuery.data) {
    return (
      <EmptyState
        title="Không tìm thấy sản phẩm"
        description="Sản phẩm này có thể đã không còn bán."
        action={
          <Button asChild>
            <Link href="/products">Xem sản phẩm</Link>
          </Button>
        }
      />
    );
  }
  if (isDirectCheckout && (productQuery.data?.stockQuantity ?? 0) <= 0) {
    return (
      <EmptyState
        title="Sản phẩm đã hết hàng"
        description="Sản phẩm này hiện không còn đủ tồn kho để thanh toán."
        action={
          <Button asChild>
            <Link href="/products">Xem sản phẩm khác</Link>
          </Button>
        }
      />
    );
  }
  if (!isDirectCheckout && (!cartSelectionIsValid || !cartItems.length)) {
    return (
      <EmptyState
        title="Sản phẩm đã thay đổi"
        description="Một số sản phẩm đã chọn không còn trong giỏ hàng."
        action={
          <Button asChild>
            <Link href="/cart">Quay lại giỏ hàng</Link>
          </Button>
        }
      />
    );
  }

  const isReady =
    Boolean(addressId) && (isDirectCheckout || cartSelectionIsValid);
  return (
    <section>
      <div>
        <p className="text-sm font-medium text-orange-600">
          Thanh toán an toàn
        </p>
        <h1 className="mt-1 text-3xl font-bold">Xác nhận đơn hàng</h1>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              <h2 className="font-semibold">Địa chỉ giao hàng</h2>
            </div>
            {selectedAddress ? (
              <div className="mt-4 rounded-xl border bg-muted/30 p-4">
                <p className="font-semibold">
                  {selectedAddress.recipientName} ·{' '}
                  {selectedAddress.recipientPhone}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[
                    selectedAddress.streetAddress,
                    selectedAddress.ward,
                    selectedAddress.district,
                    selectedAddress.city,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 h-auto p-0 text-orange-600 hover:text-orange-700"
                  onClick={() => setAddressDialogOpen(true)}
                >
                  Thay đổi
                </Button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed p-4">
                <p className="text-sm text-muted-foreground">
                  Bạn chưa có địa chỉ giao hàng. Điền thông tin bên dưới để tiếp
                  tục.
                </p>
                <div className="mt-4">
                  <AddressForm
                    onCancel={() => router.push('/cart')}
                    onSave={saveFirstAddress}
                    isSaving={savingFirstAddress}
                  />
                </div>
              </div>
            )}
          </section>
          <CheckoutCouponSelector
            options={couponOptions.data ?? []}
            selectedId={couponClaimId}
            isLoading={couponOptions.isLoading}
            onSelect={(coupon) => {
              setCouponClaimId(coupon.couponClaimId);
              toast.success(`Đã chọn mã ${coupon.code}.`);
            }}
            onClear={() => setCouponClaimId(undefined)}
          />
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-orange-600" />
              <h2 className="font-semibold">Sản phẩm</h2>
            </div>
            <div className="mt-4 divide-y">
              {isDirectCheckout && productQuery.data ? (
                <div className="flex justify-between gap-4 py-3">
                  <span>
                    {productQuery.data.name} × {directQuantity}
                  </span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
              ) : null}
              {!isDirectCheckout
                ? cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-4 py-3"
                    >
                      <span>
                        {item.product.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatPrice(Number(item.lineTotal))}
                      </span>
                    </div>
                  ))
                : null}
            </div>
          </section>
        </div>
        <aside className="h-fit rounded-2xl border bg-card p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Tổng thanh toán</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Giảm giá</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phí giao hàng</span>
              <span>{formatPrice(0)}</span>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-bold">
              <span>Tổng cộng</span>
              <span className="text-orange-600">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Thanh toán khi nhận hàng (COD).
          </p>
          <Button
            className="mt-5 w-full"
            disabled={!isReady || checkout.isPending}
            onClick={() => checkout.mutate()}
          >
            {checkout.isPending ? 'Đang đặt hàng...' : 'Đặt hàng'}
          </Button>
        </aside>
      </div>
      <AddressSelectorDialog
        open={addressDialogOpen}
        addresses={addressesQuery.data ?? []}
        selectedId={addressId}
        onOpenChange={setAddressDialogOpen}
        onSelected={(address) => setAddressId(address.id)}
        onRefresh={() => addressesQuery.refetch()}
      />
    </section>
  );
}
