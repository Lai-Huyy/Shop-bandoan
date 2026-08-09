import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CheckoutsRepository } from './checkouts.repository';
import { CheckoutsService } from './checkouts.service';

describe('CheckoutsService', () => {
  const userId = 'a7e277bd-0e42-4544-a4f8-20e37b1d1b1b';
  const addressId = 'b7e277bd-0e42-4544-a4f8-20e37b1d1b1b';
  const cartItemId = 'c7e277bd-0e42-4544-a4f8-20e37b1d1b1b';
  const productId = 'd7e277bd-0e42-4544-a4f8-20e37b1d1b1b';
  const repository = { checkout: jest.fn() };
  const service = new CheckoutsService(
    repository as unknown as CheckoutsRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('uses the cart source for selected cart-item checkout', async () => {
    repository.checkout.mockResolvedValue({ id: 'order-id' });

    await expect(
      service.checkout(userId, { addressId, cartItemIds: [cartItemId] }),
    ).resolves.toEqual({ id: 'order-id' });
    expect(repository.checkout).toHaveBeenCalledWith(
      userId,
      addressId,
      {
        kind: 'cart',
        cartItemIds: [cartItemId],
      },
      undefined,
      undefined,
    );
  });

  it('uses the direct source without a cart item', async () => {
    repository.checkout.mockResolvedValue({ id: 'order-id' });

    await expect(
      service.checkout(userId, {
        addressId,
        directItem: { productId, quantity: 2, selectedOptions: ['Large'] },
      }),
    ).resolves.toEqual({ id: 'order-id' });
    expect(repository.checkout).toHaveBeenCalledWith(
      userId,
      addressId,
      {
        kind: 'direct',
        item: { productId, quantity: 2, selectedOptions: ['Large'] },
      },
      undefined,
      undefined,
    );
  });

  it('forwards an optional coupon code to the shared checkout workflow', async () => {
    repository.checkout.mockResolvedValue({ id: 'order-id' });

    await service.checkout(userId, {
      addressId,
      cartItemIds: [cartItemId],
      couponCode: 'WELCOME10',
    });

    expect(repository.checkout).toHaveBeenCalledWith(
      userId,
      addressId,
      { kind: 'cart', cartItemIds: [cartItemId] },
      undefined,
      'WELCOME10',
    );
  });

  it('forwards an owned coupon claim to the shared checkout workflow', async () => {
    repository.checkout.mockResolvedValue({ id: 'order-id' });
    const couponClaimId = 'e7e277bd-0e42-4544-a4f8-20e37b1d1b1b';

    await service.checkout(userId, {
      addressId,
      cartItemIds: [cartItemId],
      couponClaimId,
    });

    expect(repository.checkout).toHaveBeenCalledWith(
      userId,
      addressId,
      { kind: 'cart', cartItemIds: [cartItemId] },
      couponClaimId,
      undefined,
    );
  });

  it('rejects a claim ID combined with the legacy coupon code', async () => {
    await expect(
      service.checkout(userId, {
        addressId,
        cartItemIds: [cartItemId],
        couponClaimId: 'e7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
        couponCode: 'WELCOME10',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a request that has both checkout sources', async () => {
    await expect(
      service.checkout(userId, {
        addressId,
        cartItemIds: [cartItemId],
        directItem: { productId, quantity: 1 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.checkout).not.toHaveBeenCalled();
  });

  it('maps missing selected resources to not found', async () => {
    repository.checkout.mockResolvedValue(null);

    await expect(
      service.checkout(userId, { addressId, cartItemIds: [cartItemId] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps an inapplicable coupon to a validation error', async () => {
    repository.checkout.mockRejectedValue(new Error('INVALID_COUPON'));

    await expect(
      service.checkout(userId, {
        addressId,
        cartItemIds: [cartItemId],
        couponCode: 'EXPIRED',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects checkout when stock was reserved by another transaction', async () => {
    repository.checkout.mockRejectedValue(new Error('INSUFFICIENT_STOCK'));

    await expect(
      service.checkout(userId, { addressId, cartItemIds: [cartItemId] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
