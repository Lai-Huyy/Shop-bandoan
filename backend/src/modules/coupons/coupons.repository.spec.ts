import { Prisma } from '../../../generated/prisma';
import { CouponsRepository } from './coupons.repository';

describe('CouponsRepository claim', () => {
  const userId = 'a7e277bd-0e42-4544-a4f8-20e37b1d1b1b';
  const couponId = 'b7e277bd-0e42-4544-a4f8-20e37b1d1b1b';
  const transaction = {
    couponClaim: { count: jest.fn(), create: jest.fn() },
    coupon: { findFirst: jest.fn(), updateMany: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  };
  const repository = new CouponsRepository(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.couponClaim.count.mockResolvedValue(2);
    transaction.coupon.findFirst.mockResolvedValue({
      id: couponId,
      maxRedemptions: 3,
    });
    transaction.coupon.updateMany.mockResolvedValue({ count: 1 });
    transaction.couponClaim.create.mockResolvedValue({ id: 'claim-id' });
  });

  it('atomically reserves quantity before creating the one-per-user claim', async () => {
    await expect(repository.claim(userId, couponId)).resolves.toEqual({
      id: 'claim-id',
    });

    const updateCalls = transaction.coupon.updateMany.mock.calls as unknown as [
      {
        where: { id: string; currentRedemptions: { lt: number } };
        data: { currentRedemptions: { increment: number } };
      },
    ][];
    expect(updateCalls[0][0].where).toMatchObject({
      id: couponId,
      currentRedemptions: { lt: 3 },
    });
    expect(updateCalls[0][0].data).toEqual({
      currentRedemptions: { increment: 1 },
    });
    expect(transaction.couponClaim.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { couponId, userId },
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it('does not reserve another coupon after the user owns ten', async () => {
    transaction.couponClaim.count.mockResolvedValue(10);

    await expect(repository.claim(userId, couponId)).rejects.toThrow(
      'MAX_COUPON_CLAIMS_REACHED',
    );
    expect(transaction.coupon.updateMany).not.toHaveBeenCalled();
    expect(transaction.couponClaim.create).not.toHaveBeenCalled();
  });
});
