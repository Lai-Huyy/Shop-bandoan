import Link from 'next/link';
import { ArrowUpRight, FolderOpen } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { Category } from '@/services/categories.service';
import { Reveal } from './reveal';

/* Category image URLs originate from the backend and are not safely enumerable for next/image allowlisting. */
/* eslint-disable @next/next/no-img-element */

interface HomeCategoriesProps {
  categories?: Category[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function HomeCategories({
  categories,
  isLoading,
  isError,
  onRetry,
}: HomeCategoriesProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <Reveal>
        <p className="text-sm font-bold tracking-[0.16em] text-orange-600">
          KHÁM PHÁ THEO NHÓM
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Danh mục nổi bật
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Chọn nhanh nhóm sản phẩm phù hợp với nhu cầu của bạn.
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700"
          >
            Xem tất cả <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>
      {isLoading ? (
        <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-8">
          <ErrorState
            message="Không thể tải danh mục. Vui lòng thử lại."
            retry={onRetry}
          />
        </div>
      ) : !categories?.length ? (
        <div className="mt-8">
          <EmptyState
            title="Chưa có danh mục để hiển thị"
            description="Danh mục sẽ xuất hiện tại đây khi cửa hàng cập nhật."
          />
        </div>
      ) : (
        <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.slice(0, 8).map((category, index) => (
            <Reveal key={category.id} delay={index * 45}>
              <Link
                href={`/products?category=${category.id}`}
                className="group block h-full overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex aspect-[1.45/1] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-500/15 dark:to-slate-900">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <FolderOpen className="h-10 w-10 text-orange-500 transition duration-300 group-hover:scale-110" />
                  )}
                </div>
                <div className="mt-4 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold">{category.name}</h3>
                    {category.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {category.description}
                      </p>
                    ) : null}
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-orange-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
