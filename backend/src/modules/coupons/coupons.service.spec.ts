import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DiscountType, Prisma } from '../../../generated/prisma';
import { CouponsRepository } from './coupons.repository';
import { CouponsService } from './coupons.service';

const now = new Date();
const coupon = {
  id: 'a7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
  code: 'SAVE20',
  description: 'Giảm giá chào mừng',
  discountType: DiscountType.PERCENTAGE,
  discountValue: new Prisma.Decimal('20'),
  minOrderSubtotal: new Prisma.Decimal('10000'),
  maxDiscountAmount: null,
  maxRedemptions: 100,
  currentRedemptions: 1,
  startDate: new Date(now.getTime() - 60_000),
  endDate: new Date(now.getTime() + 86_400_000),
  isActive: true,
  categoryId: null,
  createdAt: now,
  updatedAt: now,
};

describe('CouponsService', () => {
  const userId = 'b7e277bd-0e42-4544-a4f8-20e37b1d1b1b';
  const cartItemId = 'c7e277bd-0e42-4544-a4f8-20e37b1d1b1b';
  const claimId = 'd7e277bd-0e42-4544-a4f8-20e37b1d1b1b';
  const repository = {
    create: jest.fn(),
    categoryExists: jest.fn(),
    claim: jest.fn(),
    findClaimById: jest.fn(),
    findClaimByCouponCode: jest.fn(),
    findPreviewItems: jest.fn(),
    findUsableClaimsForCheckout: jest.fn(),
  };
  const service = new CouponsService(
    repository as unknown as CouponsRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('stores coupon quantity as the total claim quantity', async () => {
    repository.categoryExists.mockResolvedValue(true);
    repository.create.mockResolvedValue(coupon);

    await service.create({
      code: 'save20',
      discountType: DiscountType.PERCENTAGE,
      discountValue: '20',
      couponQuantity: 100,
      startDate: coupon.startDate.toISOString(),
      endDate: coupon.endDate.toISOString(),
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'SAVE20',
        maxRedemptions: 100,
      }),
    );
  });

  it('maps the per-user ten-coupon limit to a validation error', async () => {
    repository.claim.mockRejectedValue(new Error('MAX_COUPON_CLAIMS_REACHED'));

    await expect(service.claim(userId, coupon.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('does not preview an already-used owned coupon', async () => {
    repository.findClaimById.mockResolvedValue({
      id: claimId,
      usedAt: now,
      coupon,
    });

    await expect(
      service.preview(userId, {
        couponClaimId: claimId,
        cartItemIds: [cartItemId],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findPreviewItems).not.toHaveBeenCalled();
  });

  it('ranks applicable owned coupons by actual discount and leaves inapplicable ones disabled', async () => {
    const lowCoupon = {
      ...coupon,
      id: 'e7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
      code: 'SAVE10',
      discountValue: new Prisma.Decimal('10'),
    };
    const minimumCoupon = {
      ...coupon,
      id: 'f7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
      code: 'MIN500',
      minOrderSubtotal: new Prisma.Decimal('500000'),
    };
    repository.findPreviewItems.mockResolvedValue([
      {
        productId: 'p7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
        productName: 'Sản phẩm',
        categoryId: 1,
        unitPrice: new Prisma.Decimal('100000'),
        quantity: 1,
      },
    ]);
    repository.findUsableClaimsForCheckout.mockResolvedValue([
      { id: 'claim-low', coupon: lowCoupon },
      { id: 'claim-high', coupon },
      { id: 'claim-minimum', coupon: minimumCoupon },
    ]);

    const result = await service.checkoutOptions(userId, {
      cartItemIds: [cartItemId],
    });

    expect(result.map((item) => item.code)).toEqual([
      'SAVE20',
      'SAVE10',
      'MIN500',
    ]);
    expect(result[0]).toEqual(
      expect.objectContaining({
        isApplicable: true,
        discountAmount: '20000.00',
      }),
    );
    expect(result[2]).toEqual(
      expect.objectContaining({
        isApplicable: false,
        reason: 'Minimum order value has not been reached',
      }),
    );
  });

  it('requires an owned claim instead of accepting an arbitrary code', async () => {
    repository.findClaimByCouponCode.mockResolvedValue(null);

    await expect(
      service.preview(userId, {
        code: 'NOT-MINE',
        cartItemIds: [cartItemId],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
