import type { PaginationMeta } from './api';

export type CouponDiscountType = 'FIXED_AMOUNT' | 'PERCENTAGE';
export type CouponClaimStatus = 'AVAILABLE' | 'USED' | 'EXPIRED' | 'INACTIVE';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: CouponDiscountType;
  discountValue: string;
  minOrderSubtotal: string;
  maxDiscountAmount: string | null;
  couponQuantity: number | null;
  maxRedemptions: number | null;
  currentRedemptions: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  categoryId: number | null;
  category?: { id: number; name: string } | null;
  claimedCount?: number;
  usedCount?: number;
  remainingQuantity?: number | null;
  hasClaimed?: boolean;
}

export interface CouponPage {
  items: Coupon[];
  meta: PaginationMeta;
}

export interface CouponClaim {
  id: string;
  claimedAt: string;
  usedAt: string | null;
  status: CouponClaimStatus;
  coupon: Coupon;
}

export interface CouponClaimPage {
  items: CouponClaim[];
  meta: PaginationMeta;
}

export interface CouponPreview {
  couponClaimId: string;
  couponId: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: string;
  appliedProductId: string;
  appliedProductName: string;
  appliedUnitPrice: string;
  discountAmount: string;
  totalAmount: string;
}

export interface CheckoutCouponOption {
  couponClaimId: string;
  code: string;
  description: string | null;
  discountType: CouponDiscountType;
  discountValue: string;
  minOrderSubtotal: string;
  endDate: string;
  isApplicable: boolean;
  reason: string | null;
  appliedProductId?: string;
  appliedProductName?: string;
  discountAmount: string;
  totalAmount: string;
}

export interface CouponAnalytics {
  couponsCreated: number;
  couponsClaimed: number;
  couponsUsed: number;
  remainingCoupons: number;
}
