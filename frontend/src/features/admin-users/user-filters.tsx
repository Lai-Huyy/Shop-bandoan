'use client';

import { FilterX, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { AdminUsersQuery } from '@/types/admin-user';

interface UserFiltersProps {
  filters: AdminUsersQuery;
  onChange(filters: AdminUsersQuery): void;
  onReset(): void;
  onRefresh(): void;
  isRefreshing: boolean;
}

export function UserFilters({
  filters,
  onChange,
  onReset,
  onRefresh,
  isRefreshing,
}: UserFiltersProps) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_10rem_auto]">
        <label className="relative">
          <span className="sr-only">Tìm người dùng</span>
          <Search
            className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            value={filters.search ?? ''}
            onChange={(event) =>
              onChange({ ...filters, search: event.target.value || undefined })
            }
            placeholder="Tên, email, số điện thoại hoặc tên đăng nhập"
          />
        </label>
        <Select
          aria-label="Lọc theo vai trò"
          value={filters.role ?? ''}
          onChange={(event) =>
            onChange({ ...filters, role: event.target.value || undefined })
          }
        >
          <option value="">Tất cả vai trò</option>
          <option value="CUSTOMER">Khách hàng</option>
          <option value="ADMIN">Quản trị viên</option>
        </Select>
        <Select
          aria-label="Lọc theo trạng thái"
          value={filters.status ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              status: (event.target.value ||
                undefined) as AdminUsersQuery['status'],
            })
          }
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="SUSPENDED">Tạm ngưng</option>
          <option value="BANNED">Đã cấm</option>
        </Select>
        <Select
          aria-label="Sắp xếp ngày tạo"
          value={filters.createdAtOrder ?? 'desc'}
          onChange={(event) =>
            onChange({
              ...filters,
              createdAtOrder: event.target.value as 'asc' | 'desc',
            })
          }
        >
          <option value="desc">Mới tạo trước</option>
          <option value="asc">Cũ tạo trước</option>
        </Select>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Làm mới danh sách"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="shrink-0"
          >
            <FilterX className="h-4 w-4" />
            Đặt lại
          </Button>
        </div>
      </div>
    </section>
  );
}
