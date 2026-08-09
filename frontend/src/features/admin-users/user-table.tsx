'use client';

import { Eye, Pencil, UserRoundCheck, UserRoundX } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminUser, AdminUserStatus } from '@/types/admin-user';
import { UserRoleBadge } from './user-role-badge';
import { UserStatusBadge } from './user-status-badge';
import { formatDate, getInitials, userStatusLabels } from './user-utils';

interface UserTableProps {
  users: AdminUser[];
  isLoading: boolean;
  onView(user: AdminUser): void;
  onEdit(user: AdminUser): void;
  onChangeStatus(user: AdminUser, status: AdminUserStatus): Promise<unknown>;
}

function StatusAction({
  user,
  onChangeStatus,
}: {
  user: AdminUser;
  onChangeStatus(user: AdminUser, status: AdminUserStatus): Promise<unknown>;
}) {
  const nextStatus: AdminUserStatus =
    user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  const isDeactivating = nextStatus !== 'ACTIVE';

  return (
    <ConfirmDialog
      trigger={
        <Button
          size="icon"
          variant="ghost"
          aria-label={
            isDeactivating
              ? `Tạm ngưng ${user.fullName}`
              : `Kích hoạt ${user.fullName}`
          }
          title={isDeactivating ? 'Tạm ngưng tài khoản' : 'Kích hoạt tài khoản'}
        >
          {isDeactivating ? (
            <UserRoundX className="h-4 w-4" />
          ) : (
            <UserRoundCheck className="h-4 w-4" />
          )}
        </Button>
      }
      title={isDeactivating ? 'Tạm ngưng tài khoản?' : 'Kích hoạt tài khoản?'}
      description={`Bạn có chắc muốn chuyển tài khoản ${user.fullName} sang trạng thái “${userStatusLabels[nextStatus]}” không?`}
      confirmLabel={isDeactivating ? 'Tạm ngưng' : 'Kích hoạt'}
      onConfirm={() => onChangeStatus(user, nextStatus)}
    />
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-label="Đang tải danh sách người dùng">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-[2fr_1.5fr_1fr] gap-4 border-b pb-3 last:border-0"
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function UserTable({
  users,
  isLoading,
  onView,
  onEdit,
  onChangeStatus,
}: UserTableProps) {
  if (isLoading) return <TableSkeleton />;

  if (users.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy người dùng"
        description="Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn."
        className="m-4 border-0"
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="border-b bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {[
                'Người dùng',
                'Tên đăng nhập',
                'Email',
                'Số điện thoại',
                'Vai trò',
                'Trạng thái',
                'Ngày tạo',
                'Thao tác',
              ].map((title) => (
                <th key={title} className="px-4 py-4 font-semibold">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b last:border-0 transition-colors hover:bg-orange-500/5"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.fullName}
                      fallback={getInitials(user.fullName)}
                    />
                    <span className="font-medium">{user.fullName}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {user.username}
                </td>
                <td className="px-4 py-4">{user.email}</td>
                <td className="px-4 py-4 text-muted-foreground">
                  {user.phone ?? '—'}
                </td>
                <td className="px-4 py-4">
                  <UserRoleBadge role={user.role} />
                </td>
                <td className="px-4 py-4">
                  <UserStatusBadge status={user.status} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onView(user)}
                      aria-label={`Xem ${user.fullName}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(user)}
                      aria-label={`Sửa ${user.fullName}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <StatusAction user={user} onChangeStatus={onChangeStatus} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 p-4 lg:hidden">
        {users.map((user) => (
          <article key={user.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  src={user.avatarUrl}
                  alt={user.fullName}
                  fallback={getInitials(user.fullName)}
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user.fullName}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </div>
              <UserStatusBadge status={user.status} />
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <div>
                <dt className="sr-only">Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt className="sr-only">Số điện thoại</dt>
                <dd className="text-muted-foreground">
                  {user.phone ?? 'Chưa cập nhật số điện thoại'}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Vai trò</dt>
                <dd>
                  <UserRoleBadge role={user.role} />
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex gap-2 border-t pt-3">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => onView(user)}
              >
                <Eye className="h-4 w-4" />
                Chi tiết
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => onEdit(user)}
                aria-label={`Sửa ${user.fullName}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <StatusAction user={user} onChangeStatus={onChangeStatus} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
