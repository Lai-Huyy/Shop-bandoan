import type { PaginationMeta } from './api';

export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface AdminUser {
  id: string;
  avatarUrl: string | null;
  username: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: AdminUserStatus;
  createdAt: string;
}

export interface AdminUserAddress {
  id: string;
  label: string | null;
  recipientName: string;
  recipientPhone: string;
  streetAddress: string;
  ward?: string | null;
  district?: string | null;
  city: string;
  isDefault: boolean;
}

export interface AdminUserDetail extends AdminUser {
  addresses: AdminUserAddress[];
  orderCount: number;
}

export interface AdminUsersPage {
  items: AdminUser[];
  meta: PaginationMeta;
}

export interface AdminUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: AdminUserStatus;
  createdAtOrder?: 'asc' | 'desc';
}

export interface UpdateAdminUserInput {
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
  status?: AdminUserStatus;
}
