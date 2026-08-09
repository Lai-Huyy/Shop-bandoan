'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useDeferredValue, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { ApiError } from '@/lib/api/errors';
import { adminUsersService } from '@/services/admin-users.service';
import type {
  AdminUser,
  AdminUsersQuery,
  AdminUserStatus,
  UpdateAdminUserInput,
} from '@/types/admin-user';
import { EditUserDialog } from './edit-user-dialog';
import { UserDetailDrawer } from './user-detail-drawer';
import { UserFilters } from './user-filters';
import { UserPagination } from './user-pagination';
import {
  UserStatisticsCards,
  type UserStatistics,
} from './user-statistics-cards';
import { UserTable } from './user-table';

const defaultFilters: AdminUsersQuery = {
  page: 1,
  limit: 20,
  createdAtOrder: 'desc',
};

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Không thể tải dữ liệu người dùng. Vui lòng thử lại.';
}

async function loadStatistics(): Promise<UserStatistics> {
  const [total, customers, administrators, active, suspended, banned] =
    await Promise.all([
      adminUsersService.list({ limit: 1 }),
      adminUsersService.list({ limit: 1, role: 'CUSTOMER' }),
      adminUsersService.list({ limit: 1, role: 'ADMIN' }),
      adminUsersService.list({ limit: 1, status: 'ACTIVE' }),
      adminUsersService.list({ limit: 1, status: 'SUSPENDED' }),
      adminUsersService.list({ limit: 1, status: 'BANNED' }),
    ]);

  return {
    total: total.meta.totalItems,
    customers: customers.meta.totalItems,
    administrators: administrators.meta.totalItems,
    active: active.meta.totalItems,
    restricted: suspended.meta.totalItems + banned.meta.totalItems,
  };
}

export function AdminUsersDashboard() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminUsersQuery>(defaultFilters);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const deferredSearch = useDeferredValue(filters.search);
  const listFilters = useMemo(
    () => ({ ...filters, search: deferredSearch }),
    [deferredSearch, filters],
  );

  const usersQuery = useQuery({
    queryKey: ['admin-users', 'list', listFilters],
    queryFn: () => adminUsersService.list(listFilters),
    placeholderData: keepPreviousData,
  });
  const statisticsQuery = useQuery({
    queryKey: ['admin-users', 'statistics'],
    queryFn: loadStatistics,
  });
  const detailQuery = useQuery({
    queryKey: ['admin-users', 'detail', selectedUser?.id],
    queryFn: () => adminUsersService.getById(selectedUser!.id),
    enabled: Boolean(selectedUser),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };
  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminUserInput }) =>
      adminUsersService.update(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin người dùng');
      setEditingUser(null);
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminUserStatus }) =>
      adminUsersService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái tài khoản');
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Quản lý người dùng"
        description="Theo dõi hồ sơ, quyền truy cập và trạng thái của các tài khoản thực tế."
      />
      <UserStatisticsCards
        statistics={statisticsQuery.data}
        isLoading={statisticsQuery.isLoading}
      />
      <UserFilters
        filters={filters}
        onChange={(nextFilters) => setFilters({ ...nextFilters, page: 1 })}
        onReset={() => setFilters(defaultFilters)}
        onRefresh={refresh}
        isRefreshing={usersQuery.isFetching || statisticsQuery.isFetching}
      />
      {usersQuery.isError ? (
        <ErrorState message={errorMessage(usersQuery.error)} retry={refresh} />
      ) : (
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <UserTable
            users={usersQuery.data?.items ?? []}
            isLoading={usersQuery.isLoading}
            onView={setSelectedUser}
            onEdit={setEditingUser}
            onChangeStatus={(user, status) =>
              updateStatus.mutateAsync({ id: user.id, status })
            }
          />
          {usersQuery.data ? (
            <UserPagination
              meta={usersQuery.data.meta}
              onPageChange={(page) =>
                setFilters((current) => ({ ...current, page }))
              }
            />
          ) : null}
        </section>
      )}
      <UserDetailDrawer
        user={selectedUser}
        detail={detailQuery.data}
        isLoading={detailQuery.isLoading}
        errorMessage={
          detailQuery.isError ? errorMessage(detailQuery.error) : undefined
        }
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
        onRetry={() => void detailQuery.refetch()}
        onChangeStatus={(user, status) =>
          updateStatus.mutateAsync({ id: user.id, status })
        }
      />
      <EditUserDialog
        user={editingUser}
        open={Boolean(editingUser)}
        isSaving={updateUser.isPending}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
        onSave={(id, data) => updateUser.mutate({ id, data })}
      />
    </section>
  );
}
