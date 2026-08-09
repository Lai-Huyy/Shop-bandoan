import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { CartsRepository } from './carts.repository';
import { CartsService } from './carts.service';

describe('CartsService', () => {
  const cart = {
    id: 'e7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
    userId: 'a7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
    couponId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'b7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
        cartId: 'e7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
        productId: 'c7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
        selectedOptions: ['Large'],
        quantity: 2,
        unitPrice: new Prisma.Decimal('79000'),
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: 'c7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
          name: 'Noodle',
          slug: 'noodle',
          stockQuantity: 10,
          images: [{ url: 'https://cdn.example.test/noodle.jpg' }],
        },
      },
    ],
  };
  const repository = {
    findOrCreate: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    addItems: jest.fn(),
  };
  const service = new CartsService(repository as CartsRepository);

  beforeEach(() => jest.clearAllMocks());

  it('calculates decimal cart totals from stored unit prices', async () => {
    repository.findOrCreate.mockResolvedValue(cart);
    await expect(service.getCart(cart.userId)).resolves.toEqual(
      expect.objectContaining({
        itemCount: 2,
        subtotal: '158000.00',
        items: [expect.objectContaining({ lineTotal: '158000.00' })],
      }),
    );
  });

  it('rejects an unavailable product', async () => {
    repository.addItem.mockResolvedValue(null);
    await expect(
      service.addItem(cart.userId, {
        productId: cart.items[0].productId,
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not update an item belonging to another cart', async () => {
    repository.updateItem.mockResolvedValue(null);
    await expect(
      service.updateItem(cart.userId, cart.items[0].id, { quantity: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns a validation error when a cart quantity exceeds stock', async () => {
    repository.addItem.mockRejectedValue(new Error('INSUFFICIENT_STOCK'));

    await expect(
      service.addItem(cart.userId, {
        productId: cart.items[0].productId,
        quantity: 11,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
