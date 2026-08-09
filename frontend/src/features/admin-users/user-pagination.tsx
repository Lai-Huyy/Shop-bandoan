import { Pagination } from '@/components/ui/pagination';
import type { PaginationMeta } from '@/types/api';

export function UserPagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange(page: number): void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Hiển thị {meta.totalItems.toLocaleString('vi-VN')} người dùng
      </p>
      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
