'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useAuthDialog } from '@/hooks/use-auth-dialog';
import { cartService } from '@/services/cart.service';
import type { Product } from '@/types/product';
import { ProductPurchaseDialog } from './product-purchase-dialog';

function formatPrice(value: string): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function ProductCard({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthDialog } = useAuthDialog();
  const [action, setAction] = useState<'cart' | 'buy' | null>(null);
  const isOutOfStock = product.stockQuantity <= 0;
  const addToCart = useMutation({
    mutationFn: (input: { quantity: number; selectedOptions?: string[] }) =>
      cartService.addItem({ productId: product.id, ...input }),
    onSuccess: () => {
      toast.success('Đã thêm sản phẩm vào giỏ hàng.');
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      setAction(null);
    },
    onError: () => toast.error('Không thể thêm sản phẩm vào giỏ hàng.'),
  });

  function openPurchase(nextAction: 'cart' | 'buy') {
    if (isOutOfStock) return;
    if (!user) {
      openAuthDialog('login', () => setAction(nextAction));
      return;
    }
    setAction(nextAction);
  }

  function completePurchase(quantity: number, selectedOptions: string[]) {
    if (action === 'cart') {
      addToCart.mutate({ quantity, selectedOptions });
      return;
    }
    const params = new URLSearchParams({
      productId: product.id,
      quantity: String(quantity),
    });
    selectedOptions.forEach((option) => params.append('option', option));
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition ${isOutOfStock ? 'opacity-65' : 'hover:-translate-y-0.5 hover:shadow-lg'}`}
    >
      {isOutOfStock ? (
        <div className="absolute inset-x-0 top-3 z-10 flex justify-center">
          <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            Hết hàng
          </span>
        </div>
      ) : null}
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {product.images[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0].url}
            alt={product.images[0].altText ?? product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="p-4">
        <p className="text-xs font-medium text-orange-600">
          {product.category.name}
        </p>
        <h2 className="mt-1 line-clamp-2 min-h-12 font-semibold">
          {product.name}
        </h2>
        <p className="mt-3 text-lg font-bold text-orange-600">
          {formatPrice(product.basePrice)}
        </p>
        <p
          className={`mt-1 text-sm font-medium ${isOutOfStock ? 'text-muted-foreground' : product.stockQuantity <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}
        >
          {isOutOfStock
            ? 'Tạm hết hàng'
            : product.stockQuantity <= 5
              ? `Sắp hết: còn ${product.stockQuantity}`
              : `Còn ${product.stockQuantity} sản phẩm`}
        </p>
        {isOutOfStock ? (
          <Button className="mt-4 w-full" disabled>
            Hết hàng
          </Button>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => openPurchase('buy')}>
              <Zap className="h-4 w-4" />
              Mua ngay
            </Button>
            <Button onClick={() => openPurchase('cart')}>
              <ShoppingCart className="h-4 w-4" />
              Thêm giỏ
            </Button>
          </div>
        )}
      </div>
      <ProductPurchaseDialog
        product={product}
        action={action}
        isSubmitting={addToCart.isPending}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
        onConfirm={completePurchase}
      />
    </article>
  );
}
