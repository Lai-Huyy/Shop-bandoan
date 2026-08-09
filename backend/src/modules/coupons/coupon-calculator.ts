import { DiscountType, Prisma, type Coupon } from '../../../generated/prisma';

export interface CouponCandidateItem {
  productId: string;
  productName: string;
  categoryId: number;
  unitPrice: Prisma.Decimal;
  quantity?: number;
}

export interface CouponCalculation {
  appliedItem: CouponCandidateItem;
  discountAmount: Prisma.Decimal;
}

export type CouponCalculationFailure =
  | 'COUPON_INACTIVE'
  | 'COUPON_NOT_STARTED'
  | 'COUPON_EXPIRED'
  | 'MINIMUM_ORDER_NOT_REACHED'
  | 'NO_ELIGIBLE_PRODUCT';

export class CouponCalculationError extends Error {
  constructor(readonly code: CouponCalculationFailure) {
    super(code);
  }
}

/**
 * Applies a coupon to one eligible unit only. Claim availability is validated
 * separately because a claimed coupon remains redeemable even when all of the
 * configured quantity has already been claimed.
 */
export function calculateCouponDiscount(
  coupon: Coupon,
  subtotal: Prisma.Decimal,
  items: CouponCandidateItem[],
  now = new Date(),
): CouponCalculation {
  if (!coupon.isActive) throw new CouponCalculationError('COUPON_INACTIVE');
  if (coupon.startDate > now)
    throw new CouponCalculationError('COUPON_NOT_STARTED');
  if (coupon.endDate < now) throw new CouponCalculationError('COUPON_EXPIRED');
  if (subtotal.lessThan(coupon.minOrderSubtotal)) {
    throw new CouponCalculationError('MINIMUM_ORDER_NOT_REACHED');
  }

  const eligibleItems = coupon.categoryId
    ? items.filter((item) => item.categoryId === coupon.categoryId)
    : items;
  const appliedItem = eligibleItems.sort((left, right) => {
    const priceComparison = right.unitPrice.comparedTo(left.unitPrice);
    return priceComparison || left.productId.localeCompare(right.productId);
  })[0];
  if (!appliedItem) throw new CouponCalculationError('NO_ELIGIBLE_PRODUCT');

  let discountAmount =
    coupon.discountType === DiscountType.PERCENTAGE
      ? appliedItem.unitPrice.mul(coupon.discountValue).div(100)
      : coupon.discountValue;
  if (
    coupon.maxDiscountAmount &&
    discountAmount.greaterThan(coupon.maxDiscountAmount)
  ) {
    discountAmount = coupon.maxDiscountAmount;
  }
  if (discountAmount.greaterThan(appliedItem.unitPrice)) {
    discountAmount = appliedItem.unitPrice;
  }

  return { appliedItem, discountAmount };
}
