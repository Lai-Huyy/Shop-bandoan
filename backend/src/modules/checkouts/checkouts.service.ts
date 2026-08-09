import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CheckoutsRepository } from './checkouts.repository';
import { CheckoutDto } from './dto/checkout.dto';
@Injectable()
export class CheckoutsService {
  constructor(private readonly repository: CheckoutsRepository) {}
  async checkout(userId: string, dto: CheckoutDto) {
    const hasCartItems = Boolean(dto.cartItemIds?.length);
    const hasDirectItem = Boolean(dto.directItem);
    if (hasCartItems === hasDirectItem) {
      throw new BadRequestException(
        'Provide either selected cart item IDs or one direct checkout item',
      );
    }
    if (dto.couponClaimId && dto.couponCode) {
      throw new BadRequestException(
        'Provide a claimed coupon ID or a coupon code, not both',
      );
    }
    try {
      const order = await this.repository.checkout(
        userId,
        dto.addressId,
        hasDirectItem
          ? { kind: 'direct', item: dto.directItem! }
          : { kind: 'cart', cartItemIds: dto.cartItemIds! },
        dto.couponClaimId,
        dto.couponCode,
      );
      if (!order)
        throw new NotFoundException('Address or selected cart items not found');
      return order;
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAVAILABLE')
        throw new BadRequestException(
          'Selected products are no longer available',
        );
      if (error instanceof Error && error.message === 'INVALID_OPTIONS')
        throw new BadRequestException('Selected product options are invalid');
      if (error instanceof Error && error.message === 'INVALID_COUPON')
        throw new BadRequestException('Coupon is not applicable');
      if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK')
        throw new BadRequestException(
          'One or more selected products do not have enough stock',
        );
      throw error;
    }
  }
}
