import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function normalizeApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  const response = axiosError.response?.data;
  if (response) {
    const message = Array.isArray(response.message)
      ? response.message.join(', ')
      : response.message;

    return new ApiError(
      message || 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      response.statusCode,
      response.errors,
    );
  }

  if (axiosError.code === 'ERR_NETWORK') {
    return new ApiError(
      'Không thể kết nối đến dịch vụ. Vui lòng kiểm tra kết nối và thử lại.',
      0,
    );
  }

  return new ApiError('Đã có lỗi xảy ra. Vui lòng thử lại.', 500);
}
