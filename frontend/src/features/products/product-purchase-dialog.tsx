'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import type { Product } from '@/types/product';

function formatPrice(value: string): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

interface ProductPurchaseDialogProps {
  product: Product;
  action: 'cart' | 'buy' | null;
  isSubmitting: boolean;
  onOpenChange(open: boolean): void;
  onConfirm(quantity: number, selectedOptions: string[]): void;
}

export function ProductPurchaseDialog({
  product,
  action,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: ProductPurchaseDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [options, setOptions] = useState<Record<string, string>>({});

  useEffect(() => {
    if (action) {
      setQuantity(1);
      setOptions({});
    }
  }, [action]);

  const selectedOptions = Object.values(options).filter(Boolean);
  const canConfirm =
    product.stockQuantity > 0 &&
    product.options.every(
      (option) => !option.isRequired || Boolean(options[option.id]),
    );
  const actionLabel = action === 'buy' ? 'Tiếp tục thanh toán' : 'Thêm vào giỏ';

  return (
    <Dialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{actionLabel}</DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted-foreground">
          Chọn phiên bản và số lượng cho {product.name}.
        </DialogDescription>
        <div className="mt-5 space-y-5">
          {product.images[0]?.url ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              {/* Product image URLs may be administrator-provided remote origins. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[0].url}
                alt=""
                className="h-14 w-14 rounded-lg object-cover"
              />
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(product.basePrice)} · Còn {product.stockQuantity} sản phẩm
                </p>
              </div>
            </div>
          ) : null}

          {product.options.map((option) => (
            <label key={option.id} className="grid gap-2 text-sm font-medium">
              <span>
                {option.name}
                {option.isRequired ? (
                  <span className="ml-1 text-destructive">*</span>
                ) : null}
              </span>
              <Select
                value={options[option.id] ?? ''}
                onChange={(event) =>
                  setOptions((current) => ({
                    ...current,
                    [option.id]: event.target.value,
                  }))
                }
              >
                <option value="">Chọn {option.name.toLowerCase()}</option>
                {option.values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </label>
          ))}

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <span className="text-sm font-medium">Số lượng</span>
              <p className="text-xs text-muted-foreground">
                Tối đa {product.stockQuantity}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
                aria-label="Giảm số lượng"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() =>
                  setQuantity((current) =>
                    Math.min(product.stockQuantity, current + 1),
                  )
                }
                disabled={quantity >= product.stockQuantity}
                aria-label="Tăng số lượng"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => onConfirm(quantity, selectedOptions)}
              disabled={!canConfirm || isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : actionLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
