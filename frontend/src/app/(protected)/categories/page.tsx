'use client';

import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryGrid } from '@/features/categories/category-grid';
import { categoriesService } from '@/services/categories.service';

const categoryQuery = { page: 1, limit: 100 };

export default function CategoriesPage() {
  const categories = useQuery({
    queryKey: ['categories', 'public', categoryQuery],
    queryFn: () => categoriesService.list(categoryQuery),
  });

  if (categories.isLoading) {
    return (
      <section>
        <Skeleton className="h-9 w-44" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-56 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }
  if (categories.error) {
    return (
      <ErrorState
        message="Không thể tải danh mục. Vui lòng thử lại."
        retry={() => void categories.refetch()}
      />
    );
  }
  if (!categories.data?.items.length) {
    return (
      <EmptyState
        title="Chưa có danh mục nào"
        description="Danh mục sản phẩm sẽ xuất hiện tại đây khi cửa hàng cập nhật."
      />
    );
  }

  return (
    <section>
      <p className="text-sm font-medium text-orange-600">Khám phá cửa hàng</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Danh mục</h1>
      <p className="mt-2 text-muted-foreground">
        Chọn một danh mục để xem các sản phẩm phù hợp.
      </p>
      <div className="mt-6">
        <CategoryGrid categories={categories.data.items} />
      </div>
    </section>
  );
}
