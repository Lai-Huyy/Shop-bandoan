import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import {
  AddCartItemDto,
  CartResponseDto,
  UpdateCartItemDto,
} from './dto/cart.dto';
import { CartDetails, CartsRepository } from './carts.repository';

@Injectable()
export class CartsService {
  constructor(private readonly cartsRepository: CartsRepository) {}

  async getCart(userId: string): Promise<CartResponseDto> {
    return this.toResponse(await this.cartsRepository.findOrCreate(userId));
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartResponseDto> {
    const cart = await this.withStockValidation(() =>
      this.cartsRepository.addItem(
        userId,
        dto.productId,
        dto.quantity,
        dto.selectedOptions,
      ),
    );
    if (!cart) throw new NotFoundException('Available product not found');
    return this.toResponse(cart);
  }

  async addItems(
    userId: string,
    items: AddCartItemDto[],
  ): Promise<CartResponseDto> {
    const cart = await this.withStockValidation(() =>
      this.cartsRepository.addItems(userId, items),
    );
    if (!cart) {
      throw new NotFoundException(
        'One or more ordered products are no longer available',
      );
    }
    return this.toResponse(cart);
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.withStockValidation(() =>
      this.cartsRepository.updateItem(userId, itemId, dto.quantity),
    );
    if (!cart) throw new NotFoundException('Cart item not found');
    return this.toResponse(cart);
  }

  async removeItem(
    userId: string,
    itemId: string,
  ): Promise<{ message: string }> {
    if (!(await this.cartsRepository.removeItem(userId, itemId)))
      throw new NotFoundException('Cart item not found');
    return { message: 'Cart item successfully deleted' };
  }

  private toResponse(cart: CartDetails): CartResponseDto {
    const subtotal = cart.items.reduce(
      (total, item) => total.plus(item.unitPrice.mul(item.quantity)),
      new Prisma.Decimal(0),
    );
    return {
      id: cart.id,
      itemCount: cart.items.reduce((count, item) => count + item.quantity, 0),
      subtotal: subtotal.toFixed(2),
      items: cart.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        lineTotal: item.unitPrice.mul(item.quantity).toFixed(2),
        selectedOptions: Array.isArray(item.selectedOptions)
          ? item.selectedOptions.filter(
              (value): value is string => typeof value === 'string',
            )
          : null,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          imageUrl: item.product.images[0]?.url ?? null,
          stockQuantity: item.product.stockQuantity,
        },
      })),
    };
  }

  private async withStockValidation<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') {
        throw new BadRequestException(
          'Requested quantity exceeds available stock',
        );
      }
      throw error;
    }
  }
}
