import type { AdminUserStatus } from '@/types/admin-user';

export const userStatusLabels: Record<AdminUserStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  SUSPENDED: 'Tạm ngưng',
  BANNED: 'Đã cấm',
};

export function getRoleLabel(role: string): string {
  if (role === 'ADMIN') return 'Quản trị viên';
  if (role === 'CUSTOMER') return 'Khách hàng';
  return role;
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
