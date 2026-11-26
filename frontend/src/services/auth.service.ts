import { apiClient, getApiData } from '@/lib/api/client';
import { tokenStore } from '@/lib/auth/token-store';
import type {
  AuthenticatedUser,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from '@/types/auth';

export const authService = {
  changePassword(currentPassword: string, newPassword: string) {
    return getApiData<{ message: string }>(
      apiClient.patch('/users/change-password', {
        currentPassword,
        newPassword,
      }),
    );
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await getApiData<AuthResponse>(
      apiClient.post('/auth/login', payload, { skipAuthRefresh: true }),
    );
    tokenStore.set(response.accessToken);
    return response;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await getApiData<AuthResponse>(
      apiClient.post('/auth/register', payload, { skipAuthRefresh: true }),
    );
    tokenStore.set(response.accessToken);
    return response;
  },

  getCurrentUser(): Promise<AuthenticatedUser> {
    return getApiData(apiClient.get('/users/me'));
  },

  async refresh(): Promise<AuthResponse> {
    const response = await getApiData<AuthResponse>(
      apiClient.post('/auth/refresh', undefined, { skipAuthRefresh: true }),
    );
    tokenStore.set(response.accessToken);
    return response;
  },

  async logout(): Promise<void> {
    try {
      await getApiData(
        apiClient.post('/auth/logout', undefined, { skipAuthRefresh: true }),
      );
    } finally {
      tokenStore.clear();
    }
  },
};
