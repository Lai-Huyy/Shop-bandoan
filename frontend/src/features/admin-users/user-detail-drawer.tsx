'use client';

import {
  CalendarDays,
  Mail,
  MapPin,
  Package,
  Phone,
  UserRound,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Drawer, DrawerClose, DrawerContent } from '@/components/ui/drawer';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  AdminUser,
  AdminUserDetail,
  AdminUserStatus,
} from '@/types/admin-user';
import { UserRoleBadge } from './user-role-badge';
import { UserStatusBadge } from './user-status-badge';
import { formatDate, getInitials, userStatusLabels } from './user-utils';

interface UserDetailDrawerProps {
  user: AdminUser | null;
  detail?: AdminUserDetail;
  isLoading: boolean;
  errorMessage?: string;
  onOpenChange(open: boolean): void;
  onRetry(): void;
  onChangeStatus(user: AdminUser, status: AdminUserStatus): Promise<unknown>;
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

export function UserDetailDrawer({
  user,
  detail,
  isLoading,
  errorMessage,
  onOpenChange,
  onRetry,
  onChangeStatus,
}: UserDetailDrawerProps) {
  const visibleUser = detail ?? user;
  if (!visibleUser) return null;

  const restrictStatus: AdminUserStatus =
    visibleUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  const canBan = visibleUser.status !== 'BANNED';

  return (
    <Drawer open={Boolean(user)} onOpenChange={onOpenChange}>
      <DrawerContent className="left-auto right-0 w-[min(36rem,100vw)] overflow-y-auto border-l border-r-0 p-0">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 p-5 backdrop-blur">
          <div>
            <p className="text-sm font-medium text-orange-500">
              HỒ SƠ NGƯỜI DÙNG
            </p>
            <h2 className="mt-1 text-xl font-bold">Chi tiết tài khoản</h2>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost">Đóng</Button>
          </DrawerClose>
        </header>
        {isLoading ? (
          <div className="space-y-5 p-5">
            <Skeleton className="h-20 w-full" />
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="p-5">
            <ErrorState message={errorMessage} retry={onRetry} />
          </div>
        ) : detail ? (
          <div className="space-y-6 p-5">
            <section className="flex items-center gap-4 rounded-2xl border bg-muted/30 p-4">
              <Avatar
                src={detail.avatarUrl}
                alt={detail.fullName}
                fallback={getInitials(detail.fullName)}
                className="h-16 w-16 text-lg"
              />
              <div className="min-w-0">
                <h3 className="truncate text-xl font-bold">
                  {detail.fullName}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  @{detail.username}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <UserRoleBadge role={detail.role} />
                  <UserStatusBadge status={detail.status} />
                </div>
              </div>
            </section>
            <section>
              <h3 className="mb-4 font-semibold">Thông tin tài khoản</h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={UserRound}
                  label="Tên đăng nhập"
                  value={detail.username}
                />
                <DetailItem icon={Mail} label="Email" value={detail.email} />
                <DetailItem
                  icon={Phone}
                  label="Số điện thoại"
                  value={detail.phone ?? 'Chưa cập nhật'}
                />
                <DetailItem
                  icon={CalendarDays}
                  label="Ngày đăng ký"
                  value={formatDate(detail.createdAt)}
                />
              </dl>
            </section>
            <section>
              <div className="rounded-xl border p-4">
                <Package className="h-5 w-5 text-orange-500" />
                <p className="mt-3 text-2xl font-bold">
                  {detail.orderCount.toLocaleString('vi-VN')}
                </p>
                <p className="text-sm text-muted-foreground">Đơn hàng</p>
              </div>
            </section>
            {detail.addresses.length > 0 ? (
              <section>
                <h3 className="mb-3 font-semibold">Địa chỉ đã lưu</h3>
                <div className="space-y-3">
                  {detail.addresses.map((address) => (
                    <article key={address.id} className="rounded-xl border p-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 text-orange-500" />
                        <div className="min-w-0 text-sm">
                          <p className="font-medium">
                            {address.label ?? 'Địa chỉ giao hàng'}
                            {address.isDefault ? (
                              <span className="ml-2 text-xs text-orange-600">
                                Mặc định
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-1">
                            {address.recipientName} · {address.recipientPhone}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {[
                              address.streetAddress,
                              address.ward,
                              address.district,
                              address.city,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
            <section className="rounded-2xl border p-4">
              <h3 className="font-semibold">Trạng thái tài khoản</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Thay đổi trạng thái cần được xác nhận trước khi gửi đến máy chủ.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ConfirmDialog
                  trigger={
                    <Button variant="outline">
                      {restrictStatus === 'ACTIVE' ? 'Kích hoạt' : 'Tạm ngưng'}
                    </Button>
                  }
                  title="Xác nhận thay đổi trạng thái"
                  description={`Chuyển ${detail.fullName} sang “${userStatusLabels[restrictStatus]}”?`}
                  confirmLabel="Xác nhận"
                  onConfirm={() => onChangeStatus(detail, restrictStatus)}
                />
                {canBan ? (
                  <ConfirmDialog
                    trigger={
                      <Button variant="destructive">Cấm tài khoản</Button>
                    }
                    title="Cấm tài khoản?"
                    description={`Tài khoản ${detail.fullName} sẽ không thể tiếp tục sử dụng API.`}
                    confirmLabel="Cấm tài khoản"
                    onConfirm={() => onChangeStatus(detail, 'BANNED')}
                  />
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
