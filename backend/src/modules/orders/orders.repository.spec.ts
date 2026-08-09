import { OrderStatus, PaymentStatus } from '../../../generated/prisma';
import { OrdersRepository } from './orders.repository';

describe('OrdersRepository inventory restoration', () => {
  const orderId = '0a48432f-4e8e-4123-a03d-1ad6ad520f51';
  const productId = 'e900d4d5-4205-46cf-a48e-5a77f5354f0b';
  const transaction = {
    order: { updateMany: jest.fn(), findUnique: jest.fn() },
    payment: { updateMany: jest.fn() },
    orderItem: { findMany: jest.fn() },
    product: { updateMany: jest.fn() },
    orderStatusLog: { create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  };
  const repository = new OrdersRepository(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.order.updateMany.mockResolvedValue({ count: 1 });
    transaction.payment.updateMany.mockResolvedValue({ count: 1 });
    transaction.orderItem.findMany.mockResolvedValue([
      { productId, quantity: 2 },
    ]);
    transaction.product.updateMany.mockResolvedValue({ count: 1 });
    transaction.orderStatusLog.create.mockResolvedValue({ id: 'log-id' });
    transaction.order.findUnique.mockResolvedValue({
      id: orderId,
      status: OrderStatus.CANCELLED,
    });
  });

  it('restores stock and reverses the sold counter when cancelling an order', async () => {
    await repository.transition(
      orderId,
      [OrderStatus.PENDING],
      OrderStatus.CANCELLED,
      'admin-id',
    );

    expect(transaction.payment.updateMany).toHaveBeenCalledWith({
      where: { orderId },
      data: { status: PaymentStatus.REFUNDED },
    });
    expect(transaction.product.updateMany).toHaveBeenCalledWith({
      where: { id: productId, soldQuantity: { gte: 2 } },
      data: {
        stockQuantity: { increment: 2 },
        soldQuantity: { decrement: 2 },
      },
    });
  });
});
