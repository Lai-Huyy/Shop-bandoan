import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '../../../generated/prisma';
import type { AdminOrdersQueryDto, OrdersQueryDto } from './dto/orders.dto';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const orderInclude = {
  user: { select: { fullName: true, email: true, phone: true } },
  items: {
    include: {
      product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
    },
  },
  payment: {
    select: {
      provider: true,
      amount: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  coupon: { select: { code: true } },
  statusLogs: {
    orderBy: { createdAt: 'asc' },
    include: { changedBy: { select: { fullName: true } } },
  },
} satisfies Prisma.OrderInclude;

export type OrderDetails = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCustomer(
    userId: string,
    skip: number,
    take: number,
    query: OrdersQueryDto,
  ) {
    return this.findMany(
      { userId, ...(query.status ? { status: query.status } : {}) },
      skip,
      take,
      query.sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' },
    );
  }

  findAdmin(skip: number, take: number, query: AdminOrdersQueryDto) {
    return this.findMany(
      this.adminWhere(query),
      skip,
      take,
      this.adminOrderBy(query.sort),
    );
  }

  findCustomerDetail(userId: string, id: string) {
    return this.prisma.order.findFirst({
      where: { id, userId },
      include: orderInclude,
    });
  }

  findAdminDetail(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
  }

  async transition(
    id: string,
    current: OrderStatus[],
    status: OrderStatus,
    changedById: string,
    ownerUserId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: {
          id,
          status: { in: current },
          ...(ownerUserId ? { userId: ownerUserId } : {}),
        },
        data: {
          status,
          ...(status === OrderStatus.CANCELLED
            ? { paymentStatus: PaymentStatus.REFUNDED }
            : {}),
        },
      });
      if (result.count !== 1) return null;

      if (status === OrderStatus.CANCELLED) {
        await tx.payment.updateMany({
          where: { orderId: id },
          data: { status: PaymentStatus.REFUNDED },
        });
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: id },
          select: { productId: true, quantity: true },
        });
        await this.restoreStock(tx, orderItems);
      }

      await tx.orderStatusLog.create({
        data: {
          orderId: id,
          previousStatus: current.length === 1 ? current[0] : undefined,
          newStatus: status,
          changedById,
        },
      });
      return tx.order.findUnique({ where: { id }, include: orderInclude });
    });
  }

  async summary() {
    return this.prisma.$transaction(async (tx) => {
      const groups = await tx.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      });
      const revenue = await tx.order.aggregate({
        where: { status: OrderStatus.DELIVERED },
        _sum: { totalAmount: true },
      });
      const countByStatus = new Map(
        groups.map((group) => [group.status, group._count._all]),
      );
      return {
        totalOrders: groups.reduce(
          (total, group) => total + group._count._all,
          0,
        ),
        pendingOrders: countByStatus.get(OrderStatus.PENDING) ?? 0,
        preparingOrders: countByStatus.get(OrderStatus.PREPARING) ?? 0,
        shippingOrders: countByStatus.get(OrderStatus.OUT_FOR_DELIVERY) ?? 0,
        deliveredOrders: countByStatus.get(OrderStatus.DELIVERED) ?? 0,
        cancelledOrders: countByStatus.get(OrderStatus.CANCELLED) ?? 0,
        deliveredRevenue: revenue._sum.totalAmount?.toFixed(2) ?? '0.00',
      };
    });
  }

  private async findMany(
    where: Prisma.OrderWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.OrderOrderByWithRelationInput,
  ) {
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy,
        include: orderInclude,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, totalItems };
  }

  private adminWhere(query: AdminOrdersQueryDto): Prisma.OrderWhereInput {
    const createdAt = this.dateRange(query.dateFrom, query.dateTo);
    return {
      ...(query.status ? { status: query.status } : {}),
      ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(query.search
        ? {
            OR: [
              {
                orderNumber: {
                  contains: query.search.trim(),
                  mode: 'insensitive',
                },
              },
              {
                user: {
                  fullName: {
                    contains: query.search.trim(),
                    mode: 'insensitive',
                  },
                },
              },
              {
                user: {
                  phone: { contains: query.search.trim(), mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
  }

  private adminOrderBy(
    sort: AdminOrdersQueryDto['sort'],
  ): Prisma.OrderOrderByWithRelationInput {
    if (sort === 'oldest') return { createdAt: 'asc' };
    if (sort === 'highest-total' || sort === 'total')
      return { totalAmount: 'desc' };
    if (sort === 'lowest-total') return { totalAmount: 'asc' };
    return { createdAt: 'desc' };
  }

  private dateRange(
    dateFrom?: string,
    dateTo?: string,
  ): Prisma.DateTimeFilter | undefined {
    if (!dateFrom && !dateTo) return undefined;
    const end = dateTo ? new Date(dateTo) : undefined;
    if (end && /^\d{4}-\d{2}-\d{2}$/.test(dateTo!))
      end.setUTCHours(23, 59, 59, 999);
    return {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(end ? { lte: end } : {}),
    };
  }

  private async restoreStock(
    tx: Prisma.TransactionClient,
    orderItems: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    const quantitiesByProduct = new Map<string, number>();
    for (const item of orderItems) {
      quantitiesByProduct.set(
        item.productId,
        (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }
    for (const [productId, quantity] of quantitiesByProduct) {
      const restoredWithSalesCounter = await tx.product.updateMany({
        where: { id: productId, soldQuantity: { gte: quantity } },
        data: {
          stockQuantity: { increment: quantity },
          soldQuantity: { decrement: quantity },
        },
      });
      if (restoredWithSalesCounter.count !== 1) {
        await tx.product.updateMany({
          where: { id: productId },
          data: { stockQuantity: { increment: quantity } },
        });
      }
    }
  }
}
