'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/features/products/product-card';
import { categoriesService } from '@/services/categories.service';
import { productsService } from '@/services/products.service';

const categoryQuery = { page: 1, limit: 100 };
const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá thấp đến cao' },
  { value: 'price-desc', label: 'Giá cao đến thấp' },
  { value: 'popular', label: 'Bán chạy' },
] as const;
type ProductSort = (typeof sortOptions)[number]['value'];

function positiveInteger(value: string | null): number | undefined {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategoryId = positiveInteger(searchParams.get('category'));
  const page = positiveInteger(searchParams.get('page')) ?? 1;
  const search = searchParams.get('search')?.trim() ?? '';
  const requestedSort = searchParams.get('sort');
  const sort = sortOptions.some((option) => option.value === requestedSort)
    ? (requestedSort as ProductSort)
    : 'newest';
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => setSearchInput(search), [search]);

  const categories = useQuery({
    queryKey: ['categories', 'public', categoryQuery],
    queryFn: () => categoriesService.list(categoryQuery),
  });
  const productParams = useMemo(
    () => ({
      page,
      limit: 20,
      ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
      ...(search ? { search } : {}),
      ...(sort !== 'newest' ? { sort } : {}),
    }),
    [page, search, selectedCategoryId, sort],
  );
  const products = useQuery({
    queryKey: ['products', productParams],
    queryFn: () => productsService.list(productParams),
  });
  const selectedCategory = categories.data?.items.find(
    (category) => category.id === selectedCategoryId,
  );

  const updateParams = (
    updates: Record<string, string | number | undefined>,
    resetPage = true,
  ) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    }
    if (resetPage && updates.page === undefined) next.delete('page');
    const query = next.toString();
    router.push(query ? `/products?${query}` : '/products');
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ search: searchInput.trim() || undefined });
  };

  if (products.isLoading || categories.isLoading) {
    return (
      <section>
        <Skeleton className="h-9 w-44" />
        <Skeleton className="mt-5 h-10 w-full" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-96 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }
  if (products.error || categories.error) {
    return (
      <ErrorState
        message="Không thể tải sản phẩm. Vui lòng thử lại."
        retry={() => {
          void products.refetch();
          void categories.refetch();
        }}
      />
    );
  }

  return (
    <section>
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-label="Đường dẫn">
        <Link className="hover:text-foreground" href="/">Trang chủ</Link>
        <span aria-hidden="true">/</span>
        <Link className="hover:text-foreground" href="/categories">Danh mục</Link>
        {selectedCategory ? <><span aria-hidden="true">/</span><span className="text-foreground">{selectedCategory.name}</span></> : null}
      </nav>
      <div className="mt-4">
        <p className="text-sm font-medium text-orange-600">Khám phá cửa hàng</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {selectedCategory ? `Sản phẩm: ${selectedCategory.name}` : 'Sản phẩm'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {products.data?.meta.totalItems ?? 0} sản phẩm{selectedCategory ? ` thuộc danh mục ${selectedCategory.name}` : ''}.
        </p>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border bg-card p-4">
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Lọc danh mục">
          <Button variant={!selectedCategoryId ? 'default' : 'outline'} size="sm" className="shrink-0" onClick={() => updateParams({ category: undefined })}>Tất cả</Button>
          {categories.data?.items.map((category) => (
            <Button key={category.id} variant={category.id === selectedCategoryId ? 'default' : 'outline'} size="sm" className="shrink-0" onClick={() => updateParams({ category: category.id })}>{category.name}</Button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <form className="flex flex-1 gap-2" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="product-search">Tìm kiếm sản phẩm</label>
            <input id="product-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm kiếm sản phẩm" className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3" />
            <Button type="submit" variant="outline"><Search className="h-4 w-4" />Tìm</Button>
          </form>
          <label className="flex items-center gap-2 text-sm font-medium">
            Sắp xếp
            <select value={sort} onChange={(event) => updateParams({ sort: event.target.value === 'newest' ? undefined : event.target.value })} className="h-10 rounded-md border bg-background px-3 text-sm">
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      {!products.data?.items.length ? (
        <div className="mt-6">
          <EmptyState
            title={selectedCategory ? 'Không tìm thấy sản phẩm trong danh mục này' : 'Chưa có sản phẩm nào'}
            description={search ? 'Hãy thử từ khóa tìm kiếm khác hoặc bỏ bộ lọc.' : 'Sản phẩm sẽ xuất hiện tại đây khi cửa hàng cập nhật.'}
            action={selectedCategoryId || search ? <Button variant="outline" onClick={() => updateParams({ category: undefined, search: undefined, sort: undefined })}>Xóa bộ lọc</Button> : undefined}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.data.items.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
          <div className="mt-8">
            <Pagination page={products.data.meta.page} totalPages={products.data.meta.totalPages} onPageChange={(nextPage) => updateParams({ page: nextPage }, false)} />
          </div>
        </>
      )}
    </section>
  );
}
