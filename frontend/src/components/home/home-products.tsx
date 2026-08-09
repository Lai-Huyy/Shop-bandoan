'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ProductCard } from '@/features/products/product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/types/product';
import { Reveal } from './reveal';

interface HomeProductsProps {
  products?: Product[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function HomeProducts({
  products,
  isLoading,
  isError,
  onRetry,
}: HomeProductsProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: 1 | -1) =>
    carouselRef.current?.scrollBy({
      left: direction * 360,
      behavior: 'smooth',
    });

  return (
    <section className="border-y bg-slate-50/80 py-16 dark:bg-slate-950/45 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-bold tracking-[0.16em] text-orange-600">
                LỰA CHỌN HÔM NAY
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Sản phẩm nổi bật
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Khám phá những sản phẩm đang có tại cửa hàng.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Sản phẩm trước"
                onClick={() => scroll(-1)}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Sản phẩm tiếp theo"
                onClick={() => scroll(1)}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                asChild
                variant="outline"
                className="ml-2 hidden rounded-full sm:inline-flex"
              >
                <Link href="/products">Xem tất cả</Link>
              </Button>
            </div>
          </div>
        </Reveal>
        {isLoading ? (
          <div className="mt-9 flex gap-5 overflow-hidden">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton
                key={index}
                className="h-[25rem] min-w-[17rem] rounded-2xl"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="mt-8">
            <ErrorState
              message="Không thể tải sản phẩm. Vui lòng thử lại."
              retry={onRetry}
            />
          </div>
        ) : !products?.length ? (
          <div className="mt-8">
            <EmptyState
              title="Chưa có sản phẩm để hiển thị"
              description="Sản phẩm sẽ xuất hiện tại đây khi cửa hàng cập nhật."
              action={
                <Button asChild variant="outline">
                  <Link href="/products">Xem cửa hàng</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div
              ref={carouselRef}
              className="home-scrollbar mt-9 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4"
              aria-label="Danh sách sản phẩm nổi bật"
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="w-[17rem] shrink-0 snap-start sm:w-[18rem]"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            <Button
              asChild
              variant="outline"
              className="mt-4 w-full rounded-full sm:hidden"
            >
              <Link href="/products">Xem tất cả sản phẩm</Link>
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
