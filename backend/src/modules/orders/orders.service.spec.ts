import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '../../../generated/prisma';
import { CartsService } from '../carts/carts.service';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

const customerId = '8dc7314e-023a-4e71-a0da-16eac7c3c950';
const adminId = '2c72b1fd-0da8-4a04-95b5-6263a9c55b64';
const orderId = '0a48432f-4e8e-4123-a03d-1ad6ad520f51';

describe('OrdersService', () => {
  const repository = {
    findCustomer: jest.fn(),
    findAdmin: jest.fn(),
    findCustomerDetail: jest.fn(),
    findAdminDetail: jest.fn(),
    transition: jest.fn(),
    summary: jest.fn(),
  };
  const cartsService = { addItems: jest.fn() };
  const service = new OrdersService(
    repository as unknown as OrdersRepository,
    cartsService as unknown as CartsService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('cancels an owned pending order with ownership in the mutation predicate', async () => {
    repository.transition.mockResolvedValue({
      id: orderId,
      status: OrderStatus.CANCELLED,
    });

    await expect(service.cancel(customerId, orderId)).resolves.toMatchObject({
      status: OrderStatus.CANCELLED,
    });
    expect(repository.transition).toHaveBeenCalledWith(
      orderId,
      [OrderStatus.PENDING, OrderStatus.CONFIRMED],
      OrderStatus.CANCELLED,
      customerId,
      customerId,
    );
  });

  it('does not reveal or cancel another customer order', async () => {
    repository.transition.mockResolvedValue(null);
    repository.findCustomerDetail.mockResolvedValue(null);

    await expect(service.cancel(customerId, orderId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects cancellation after the order has left its cancellable states', async () => {
    repository.transition.mockResolvedValue(null);
    repository.findCustomerDetail.mockResolvedValue({
      status: OrderStatus.PREPARING,
    });

    await expect(service.cancel(customerId, orderId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('adds order items and their selected options back to the cart through CartsService', async () => {
    repository.findCustomerDetail.mockResolvedValue({
      id: orderId,
      items: [
        {
          productId: 'e900d4d5-4205-46cf-a48e-5a77f5354f0b',
          quantity: 2,
          selectedOptionsSnapshot: ['Cay vừa'],
        },
      ],
    });
    cartsService.addItems.mockResolvedValue({ id: 'cart-id' });

    await expect(service.buyAgain(customerId, orderId)).resolves.toEqual({
      id: 'cart-id',
    });
    expect(cartsService.addItems).toHaveBeenCalledWith(customerId, [
      {
        productId: 'e900d4d5-4205-46cf-a48e-5a77f5354f0b',
        quantity: 2,
        selectedOptions: ['Cay vừa'],
      },
    ]);
  });

  it('allows only the next approved operational status', async () => {
    repository.findAdminDetail.mockResolvedValue({
      status: OrderStatus.CONFIRMED,
    });
    repository.transition.mockResolvedValue({
      id: orderId,
      status: OrderStatus.PREPARING,
    });

    await expect(
      service.updateStatus(adminId, orderId, OrderStatus.PREPARING),
    ).resolves.toMatchObject({ status: OrderStatus.PREPARING });

    await expect(
      service.updateStatus(adminId, orderId, OrderStatus.DELIVERED),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
