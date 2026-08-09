import { DiscountType, Prisma, ProductStatus } from '../../../generated/prisma';
import { CheckoutsRepository } from './checkouts.repository';

describe('CheckoutsRepository inventory reservation', () => {
  const userId = 'a7e277bd-0e42-4544-a4f8-20e37b1d1b1b';
  const addressId = 'b7e277bd-0e42-4544-a4f8-20e37b1d1b1b';
  const productId = 'c7e277bd-0e42-4544-a4f8-20e37b1d1b1b';
  const transaction = {
    userAddress: { findFirst: jest.fn() },
    product: { findFirst: jest.fn(), updateMany: jest.fn() },
    order: { create: jest.fn() },
    couponClaim: { findFirst: jest.fn(), updateMany: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  };
  const repository = new CheckoutsRepository(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.userAddress.findFirst.mockResolvedValue({
      id: addressId,
      recipientName: 'Customer',
      recipientPhone: '0900000000',
      streetAddress: '1 Test Street',
      ward: null,
      district: null,
      city: 'Hà Nội',
      note: null,
      provinceCode: null,
      provinceName: null,
      wardCode: null,
      wardName: null,
    });
    transaction.product.findFirst.mockResolvedValue({
      id: productId,
      name: 'Noodle',
      basePrice: new Prisma.Decimal('50000'),
      status: ProductStatus.AVAILABLE,
      stockQuantity: 2,
      options: [],
    });
    transaction.order.create.mockResolvedValue({ id: 'order-id' });
  });

  it('reserves available stock before creating a direct-checkout order', async () => {
    transaction.product.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      repository.checkout(userId, addressId, {
        kind: 'direct',
        item: { productId, quantity: 2 },
      }),
    ).resolves.toEqual({ id: 'order-id' });

    expect(transaction.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: productId,
        status: ProductStatus.AVAILABLE,
        stockQuantity: { gte: 2 },
      },
      data: {
        stockQuantity: { decrement: 2 },
        soldQuantity: { increment: 2 },
      },
    });
    expect(transaction.order.create).toHaveBeenCalledTimes(1);
  });

  it('rejects and does not create an order when conditional stock reservation fails', async () => {
    transaction.product.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.checkout(userId, addressId, {
        kind: 'direct',
        item: { productId, quantity: 2 },
      }),
    ).rejects.toThrow('INSUFFICIENT_STOCK');
    expect(transaction.order.create).not.toHaveBeenCalled();
  });

  it('marks the owned coupon claim used inside the checkout transaction', async () => {
    const couponClaimId = 'd7e277bd-0e42-4544-a4f8-20e37b1d1b1b';
    transaction.product.updateMany.mockResolvedValue({ count: 1 });
    transaction.product.findFirst.mockResolvedValue({
      id: productId,
      name: 'Noodle',
      basePrice: new Prisma.Decimal('50000'),
      status: ProductStatus.AVAILABLE,
      stockQuantity: 2,
      categoryId: 1,
      options: [],
    });
    transaction.couponClaim.findFirst.mockResolvedValue({
      id: couponClaimId,
      coupon: {
        id: 'e7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
        discountValue: new Prisma.Decimal('10'),
        minOrderSubtotal: new Prisma.Decimal('0'),
        maxDiscountAmount: null,
        maxRedemptions: 1,
        currentRedemptions: 1,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-01-01'),
        isActive: true,
        categoryId: null,
      },
    });
    transaction.couponClaim.updateMany.mockResolvedValue({ count: 1 });

    await repository.checkout(
      userId,
      addressId,
      { kind: 'direct', item: { productId, quantity: 1 } },
      couponClaimId,
    );

    const orderCreateCalls = transaction.order.create.mock.calls as unknown as [
      { data: { couponId?: string } },
    ][];
    const claimUpdateCalls = transaction.couponClaim.updateMany.mock
      .calls as unknown as [
      {
        where: { id: string; userId: string; usedAt: null };
        data: { orderId: string };
      },
    ][];
    expect(orderCreateCalls[0][0].data.couponId).toBe(
      'e7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
    );
    expect(claimUpdateCalls[0][0].where).toMatchObject({
      id: couponClaimId,
      userId,
      usedAt: null,
    });
    expect(claimUpdateCalls[0][0].data.orderId).toBe('order-id');
  });
});
