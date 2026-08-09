import axios, { type InternalAxiosRequestConfig } from 'axios';
import { tokenStore } from '@/lib/auth/token-store';
import type { ApiEnvelope } from '@/types/api';
import type { AuthResponse } from '@/types/auth';
import { normalizeApiError } from './errors';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
    retriedAfterRefresh?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    skipAuthRefresh?: boolean;
    retriedAfterRefresh?: boolean;
  }
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!apiBaseUrl) {
    return Promise.reject(new Error('NEXT_PUBLIC_API_URL must be configured.'));
  }

  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<ApiEnvelope<AuthResponse>>('/auth/refresh', undefined, {
        skipAuthRefresh: true,
      })
      .then((response) => {
        tokenStore.set(response.data.data.accessToken);
        return response.data.data.accessToken;
      })
      .catch(() => {
        tokenStore.clear();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(normalizeApiError(error));
    }

    const request = error.config;
    const isUnauthorized = error.response?.status === 401;
    if (
      isUnauthorized &&
      !request.skipAuthRefresh &&
      !request.retriedAfterRefresh
    ) {
      request.retriedAfterRefresh = true;
      const token = await refreshAccessToken();
      if (token) {
        return apiClient(request);
      }
    }

    return Promise.reject(normalizeApiError(error));
  },
);

export async function getApiData<T>(
  request: Promise<{ data: ApiEnvelope<T> }>,
): Promise<T> {
  const response = await request;
  return response.data.data;
}
