import { apiClient, getApiData } from '@/lib/api/client';
import type {
  CheckoutCouponOption,
  Coupon,
  CouponAnalytics,
  CouponClaim,
  CouponClaimPage,
  CouponPage,
  CouponPreview,
} from '@/types/coupon';

type CouponItemSource = {
  cartItemIds?: string[];
  directProductId?: string;
  directQuantity?: number;
};

export const couponsService = {
  list: (params?: Record<string, string | number | boolean>) =>
    getApiData<CouponPage>(apiClient.get('/coupons', { params })),
  getAvailable: (params?: Record<string, string | number | boolean>) =>
    getApiData<CouponPage>(apiClient.get('/coupons/available', { params })),
  getMine: (params?: Record<string, string | number | boolean>) =>
    getApiData<CouponClaimPage>(apiClient.get('/coupons/my', { params })),
  getAnalytics: () =>
    getApiData<CouponAnalytics>(apiClient.get('/coupons/analytics')),
  claim: (id: string) =>
    getApiData<CouponClaim>(apiClient.post(`/coupons/${id}/claim`)),
  create: (data: unknown) =>
    getApiData<Coupon>(apiClient.post('/coupons', data)),
  update: (id: string, data: unknown) =>
    getApiData<Coupon>(apiClient.patch(`/coupons/${id}`, data)),
  remove: (id: string) =>
    getApiData<{ message: string }>(apiClient.delete(`/coupons/${id}`)),
  preview: (
    data: CouponItemSource & { couponClaimId?: string; code?: string },
  ) => getApiData<CouponPreview>(apiClient.post('/coupons/preview', data)),
  checkoutOptions: (data: CouponItemSource) =>
    getApiData<CheckoutCouponOption[]>(
      apiClient.post('/coupons/checkout-options', data),
    ),
};
