'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/features/products/product-card';
import { productsService } from '@/services/products.service';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsService.getById(id),
  });

  if (productQuery.isLoading) return <Skeleton className="h-[34rem] rounded-2xl" />;
  if (productQuery.error || !productQuery.data) {
    return <ErrorState message="Không thể tải chi tiết sản phẩm." retry={() => void productQuery.refetch()} />;
  }

  const product = productQuery.data;
  return (
    <section className="mx-auto max-w-5xl">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          {product.images[0]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0].url} alt={product.images[0].altText ?? product.name} className="aspect-[4/3] w-full object-cover" />
          ) : <div className="aspect-[4/3] bg-muted" />}
          <div className="p-6">
            <p className="text-sm font-medium text-orange-600">{product.category.name}</p>
            <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
            <p className={`mt-3 font-medium ${product.stockQuantity <= 0 ? 'text-muted-foreground' : product.stockQuantity <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {product.stockQuantity <= 0 ? 'Tạm hết hàng' : `Còn ${product.stockQuantity} sản phẩm`}
            </p>
            {product.description ? <p className="mt-5 whitespace-pre-line text-muted-foreground">{product.description}</p> : null}
          </div>
        </div>
        <ProductCard product={product} />
      </div>
    </section>
  );
}
