import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '../../../generated/prisma';
import { CartsService } from '../carts/carts.service';
import type {
  AdminOrdersQueryDto,
  OrderPaginationQueryDto,
  OrdersQueryDto,
} from './dto/orders.dto';
import { OrdersRepository } from './orders.repository';

const transitions: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: OrderStatus.CONFIRMED,
  CONFIRMED: OrderStatus.PREPARING,
  PREPARING: OrderStatus.READY_FOR_PICKUP,
  READY_FOR_PICKUP: OrderStatus.OUT_FOR_DELIVERY,
  OUT_FOR_DELIVERY: OrderStatus.DELIVERED,
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly repository: OrdersRepository,
    private readonly cartsService: CartsService,
  ) {}

  async customerList(userId: string, query: OrdersQueryDto) {
    return this.page(
      await this.repository.findCustomer(
        userId,
        (query.page - 1) * query.limit,
        query.limit,
        query,
      ),
      query,
    );
  }

  async adminList(query: AdminOrdersQueryDto) {
    this.ensureDateRange(query);
    return this.page(
      await this.repository.findAdmin(
        (query.page - 1) * query.limit,
        query.limit,
        query,
      ),
      query,
    );
  }

  async customerDetail(userId: string, id: string) {
    const order = await this.repository.findCustomerDetail(userId, id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async adminDetail(id: string) {
    const order = await this.repository.findAdminDetail(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  adminSummary() {
    return this.repository.summary();
  }

  async cancel(userId: string, id: string) {
    const order = await this.repository.transition(
      id,
      [OrderStatus.PENDING, OrderStatus.CONFIRMED],
      OrderStatus.CANCELLED,
      userId,
      userId,
    );
    if (order) return order;

    const exists = await this.repository.findCustomerDetail(userId, id);
    if (!exists) throw new NotFoundException('Order not found');
    throw new BadRequestException(
      'Order cannot be cancelled in its current status',
    );
  }

  async buyAgain(userId: string, id: string) {
    const order = await this.customerDetail(userId, id);
    return this.cartsService.addItems(
      userId,
      order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedOptions: this.selectedOptions(item.selectedOptionsSnapshot),
      })),
    );
  }

  async updateStatus(adminId: string, id: string, status: OrderStatus) {
    const existing = await this.adminDetail(id);
    const canCancel =
      status === OrderStatus.CANCELLED &&
      (existing.status === OrderStatus.PENDING ||
        existing.status === OrderStatus.CONFIRMED);
    if (!canCancel && transitions[existing.status] !== status) {
      throw new BadRequestException('Invalid order status transition');
    }

    const order = await this.repository.transition(
      id,
      [existing.status],
      status,
      adminId,
    );
    if (!order) {
      throw new ForbiddenException(
        'Order status changed; refresh and try again',
      );
    }
    return order;
  }

  private page(
    result: { items: unknown[]; totalItems: number },
    query: OrderPaginationQueryDto,
  ) {
    return {
      items: result.items,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / query.limit),
      },
    };
  }

  private ensureDateRange(query: AdminOrdersQueryDto): void {
    if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) {
      throw new BadRequestException('dateFrom must not be after dateTo');
    }
  }

  private selectedOptions(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) return undefined;
    const options = value.filter(
      (option): option is string => typeof option === 'string',
    );
    return options.length === value.length ? options : undefined;
  }
}
