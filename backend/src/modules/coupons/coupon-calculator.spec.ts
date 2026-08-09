import { DiscountType, Prisma } from '../../../generated/prisma';
import {
  CouponCalculationError,
  calculateCouponDiscount,
} from './coupon-calculator';

describe('calculateCouponDiscount', () => {
  const coupon = {
    id: 'coupon-id',
    code: 'SAVE20',
    description: null,
    discountType: DiscountType.PERCENTAGE,
    discountValue: new Prisma.Decimal('20'),
    minOrderSubtotal: new Prisma.Decimal('0'),
    maxDiscountAmount: null,
    maxRedemptions: null,
    currentRedemptions: 0,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-01-01'),
    isActive: true,
    categoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const items = [
    {
      productId: 'a',
      productName: 'A',
      categoryId: 1,
      unitPrice: new Prisma.Decimal('50000'),
    },
    {
      productId: 'b',
      productName: 'B',
      categoryId: 1,
      unitPrice: new Prisma.Decimal('80000'),
    },
  ];

  it('discounts only one highest-priced unit, never its quantity or subtotal', () => {
    const result = calculateCouponDiscount(
      coupon,
      new Prisma.Decimal('240000'),
      items,
      new Date('2026-06-01'),
    );
    expect(result.appliedItem.productId).toBe('b');
    expect(result.discountAmount.toFixed(2)).toBe('16000.00');
  });

  it('limits fixed discounts to the selected unit price', () => {
    const result = calculateCouponDiscount(
      {
        ...coupon,
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: new Prisma.Decimal('100000'),
      },
      new Prisma.Decimal('240000'),
      items,
      new Date('2026-06-01'),
    );
    expect(result.discountAmount.toFixed(2)).toBe('80000.00');
  });

  it('uses the highest-priced unit within the configured category only', () => {
    const result = calculateCouponDiscount(
      { ...coupon, categoryId: 1 },
      new Prisma.Decimal('300000'),
      [
        ...items,
        {
          productId: 'c',
          productName: 'C',
          categoryId: 2,
          unitPrice: new Prisma.Decimal('200000'),
        },
      ],
      new Date('2026-06-01'),
    );
    expect(result.appliedItem.productId).toBe('b');
  });

  it('rejects an expired coupon before it can be selected or redeemed', () => {
    expect(() =>
      calculateCouponDiscount(
        { ...coupon, endDate: new Date('2026-05-31') },
        new Prisma.Decimal('240000'),
        items,
        new Date('2026-06-01'),
      ),
    ).toThrow(CouponCalculationError);
  });
});
