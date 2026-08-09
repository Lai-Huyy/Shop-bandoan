import { Injectable } from '@nestjs/common';
import { Prisma, ProductStatus } from '../../../generated/prisma';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const cartInclude = {
  items: {
    include: {
      product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.CartInclude;

export type CartDetails = Prisma.CartGetPayload<{
  include: typeof cartInclude;
}>;

@Injectable()
export class CartsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOrCreate(userId: string): Promise<CartDetails> {
    return this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: cartInclude,
    });
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
    selectedOptions?: string[],
  ): Promise<CartDetails | null> {
    return this.addItems(userId, [{ productId, quantity, selectedOptions }]);
  }

  async addItems(
    userId: string,
    items: Array<{
      productId: string;
      quantity: number;
      selectedOptions?: string[];
    }>,
  ): Promise<CartDetails | null> {
    return this.prisma.$transaction(async (tx) => {
      const productIds = [...new Set(items.map((item) => item.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, status: ProductStatus.AVAILABLE },
        select: { id: true, basePrice: true, stockQuantity: true },
      });
      if (products.length !== productIds.length) return null;

      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );
      const cart = await tx.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
      const existingItems = await tx.cartItem.findMany({
        where: { cartId: cart.id, productId: { in: productIds } },
        select: { productId: true, quantity: true },
      });
      this.ensureRequestedQuantitiesFitStock(items, existingItems, products);
      await tx.cartItem.createMany({
        data: items.map((item) => ({
          cartId: cart.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: productsById.get(item.productId)!.basePrice,
          selectedOptions: item.selectedOptions,
        })),
      });
      return tx.cart.findUniqueOrThrow({
        where: { id: cart.id },
        include: cartInclude,
      });
    });
  }

  async updateItem(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartDetails | null> {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (!cart) return null;
      const item = await tx.cartItem.findFirst({
        where: { id: itemId, cartId: cart.id },
        select: { productId: true },
      });
      if (!item) return null;
      const [relatedItems, product] = await Promise.all([
        tx.cartItem.findMany({
          where: { cartId: cart.id, productId: item.productId },
          select: { id: true, quantity: true },
        }),
        tx.product.findFirst({
          where: { id: item.productId, status: ProductStatus.AVAILABLE },
          select: { stockQuantity: true },
        }),
      ]);
      if (!product) return null;
      const otherQuantity = relatedItems
        .filter((relatedItem) => relatedItem.id !== itemId)
        .reduce((total, relatedItem) => total + relatedItem.quantity, 0);
      if (otherQuantity + quantity > product.stockQuantity) {
        throw new Error('INSUFFICIENT_STOCK');
      }
      const result = await tx.cartItem.updateMany({
        where: { id: itemId, cartId: cart.id },
        data: { quantity },
      });
      if (result.count !== 1) return null;
      return tx.cart.findUniqueOrThrow({
        where: { id: cart.id },
        include: cartInclude,
      });
    });
  }

  async removeItem(userId: string, itemId: string): Promise<boolean> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!cart) return false;
    const result = await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });
    return result.count === 1;
  }

  private ensureRequestedQuantitiesFitStock(
    requestedItems: Array<{ productId: string; quantity: number }>,
    existingItems: Array<{ productId: string; quantity: number }>,
    products: Array<{ id: string; stockQuantity: number }>,
  ): void {
    const quantitiesByProduct = new Map<string, number>();
    for (const item of [...existingItems, ...requestedItems]) {
      quantitiesByProduct.set(
        item.productId,
        (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }
    if (
      products.some(
        (product) =>
          (quantitiesByProduct.get(product.id) ?? 0) > product.stockQuantity,
      )
    ) {
      throw new Error('INSUFFICIENT_STOCK');
    }
  }
}
