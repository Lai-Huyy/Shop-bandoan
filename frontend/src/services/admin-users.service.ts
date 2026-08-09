import { apiClient, getApiData } from '@/lib/api/client';
import type {
  AdminUser,
  AdminUserDetail,
  AdminUsersPage,
  AdminUsersQuery,
  AdminUserStatus,
  UpdateAdminUserInput,
} from '@/types/admin-user';

export const adminUsersService = {
  list: (params: AdminUsersQuery = {}) =>
    getApiData<AdminUsersPage>(apiClient.get('/admin/users', { params })),
  getById: (id: string) =>
    getApiData<AdminUserDetail>(apiClient.get(`/admin/users/${id}`)),
  update: (id: string, data: UpdateAdminUserInput) =>
    getApiData<AdminUser>(apiClient.patch(`/admin/users/${id}`, data)),
  updateStatus: (id: string, status: AdminUserStatus) =>
    getApiData<AdminUser>(
      apiClient.patch(`/admin/users/${id}/status`, { status }),
    ),
};
