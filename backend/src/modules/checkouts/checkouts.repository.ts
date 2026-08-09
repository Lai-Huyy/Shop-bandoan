import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  PaymentMethod,
  PaymentStatus,
  Prisma,
  ProductStatus,
  DiscountType,
} from '../../../generated/prisma';
import type { DirectCheckoutItemDto } from './dto/checkout.dto';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  calculateCouponDiscount,
  type CouponCalculation,
} from '../coupons/coupon-calculator';

export type CheckoutSource =
  | { kind: 'cart'; cartItemIds: string[] }
  | { kind: 'direct'; item: DirectCheckoutItemDto };

interface CheckoutItem {
  productId: string;
  productName: string;
  unitPrice: Prisma.Decimal;
  quantity: number;
  selectedOptions: string[] | null;
  productStatus: ProductStatus;
  stockQuantity: number;
  categoryId: number;
  productOptions: { values: Prisma.JsonValue; isRequired: boolean }[];
}

@Injectable()
export class CheckoutsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(
    userId: string,
    addressId: string,
    source: CheckoutSource,
    couponClaimId?: string,
    couponCode?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const address = await tx.userAddress.findFirst({
        where: { id: addressId, userId },
      });
      if (!address) return null;

      const items = await this.getCheckoutItems(tx, userId, source);
      if (!items) return null;

      this.ensureItemsCanBePurchased(items);
      await this.reserveStock(tx, items);
      const subtotal = items.reduce(
        (sum, item) => sum.plus(item.unitPrice.mul(item.quantity)),
        new Prisma.Decimal(0),
      );
      const coupon = await this.prepareCouponRedemption(
        tx,
        userId,
        couponClaimId,
        couponCode,
        subtotal,
        items,
      );
      const discountAmount = coupon?.discountAmount ?? new Prisma.Decimal(0);
      const totalAmount = subtotal.minus(discountAmount);
      const order = await tx.order.create({
        data: {
          orderNumber: `ORD-${randomUUID().replace(/-/g, '').slice(0, 20).toUpperCase()}`,
          userId,
          addressId,
          shippingRecipientName: address.recipientName,
          shippingRecipientPhone: address.recipientPhone,
          shippingStreetAddress: address.streetAddress,
          shippingWard: address.ward,
          shippingDistrict: address.district,
          shippingCity: address.city,
          shippingAddressNote: address.note,
          shippingProvinceCode: address.provinceCode,
          shippingProvinceName: address.provinceName ?? address.city,
          shippingWardCode: address.wardCode,
          shippingWardName: address.wardName ?? address.ward,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PENDING,
          subtotal,
          discountAmount,
          totalAmount,
          ...(coupon ? { couponId: coupon.id } : {}),
          ...(coupon
            ? {
                couponCodeSnapshot: coupon.code,
                couponDiscountTypeSnapshot: coupon.discountType,
                couponDiscountValueSnapshot: coupon.discountValue,
                couponAppliedUnitPrice: coupon.appliedItem.unitPrice,
              }
            : {}),
          items: {
            create: items.map((item) => ({
              product: { connect: { id: item.productId } },
              productName: item.productName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              totalPrice: item.unitPrice.mul(item.quantity),
              selectedOptionsSnapshot: item.selectedOptions ?? Prisma.JsonNull,
            })),
          },
          payment: {
            create: {
              provider: PaymentMethod.COD,
              status: PaymentStatus.PENDING,
              amount: totalAmount,
            },
          },
          statusLogs: { create: { newStatus: 'PENDING', changedById: userId } },
        },
        include: { payment: true, items: true },
      });

      if (coupon) {
        await this.markCouponClaimUsed(tx, userId, coupon.claimId, order.id);
      }

      if (source.kind === 'cart') {
        const cart = await tx.cart.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (!cart) throw new Error('CART_NOT_FOUND');
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id, id: { in: source.cartItemIds } },
        });
      }

      return order;
    });
  }

  private async getCheckoutItems(
    tx: Prisma.TransactionClient,
    userId: string,
    source: CheckoutSource,
  ): Promise<CheckoutItem[] | null> {
    if (source.kind === 'direct') {
      const product = await tx.product.findFirst({
        where: { id: source.item.productId, status: ProductStatus.AVAILABLE },
        include: { options: { select: { values: true, isRequired: true } } },
      });
      if (!product) return null;
      return [
        {
          productId: product.id,
          productName: product.name,
          unitPrice: product.basePrice,
          quantity: source.item.quantity,
          selectedOptions: source.item.selectedOptions ?? null,
          productStatus: product.status,
          stockQuantity: product.stockQuantity,
          categoryId: product.categoryId,
          productOptions: product.options,
        },
      ];
    }

    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          where: { id: { in: source.cartItemIds } },
          include: {
            product: {
              include: {
                options: { select: { values: true, isRequired: true } },
              },
            },
          },
        },
      },
    });
    if (!cart || cart.items.length !== source.cartItemIds.length) return null;

    return cart.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      selectedOptions: this.toSelectedOptions(item.selectedOptions),
      productStatus: item.product.status,
      stockQuantity: item.product.stockQuantity,
      categoryId: item.product.categoryId,
      productOptions: item.product.options,
    }));
  }

  private ensureItemsCanBePurchased(items: CheckoutItem[]) {
    if (items.some((item) => item.productStatus !== ProductStatus.AVAILABLE)) {
      throw new Error('UNAVAILABLE');
    }
    if (items.some((item) => !this.areOptionsValid(item))) {
      throw new Error('INVALID_OPTIONS');
    }
  }

  private async reserveStock(
    tx: Prisma.TransactionClient,
    items: CheckoutItem[],
  ): Promise<void> {
    const quantitiesByProduct = new Map<string, number>();
    for (const item of items) {
      quantitiesByProduct.set(
        item.productId,
        (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }

    for (const [productId, quantity] of quantitiesByProduct) {
      const result = await tx.product.updateMany({
        where: {
          id: productId,
          status: ProductStatus.AVAILABLE,
          stockQuantity: { gte: quantity },
        },
        data: {
          stockQuantity: { decrement: quantity },
          soldQuantity: { increment: quantity },
        },
      });
      if (result.count !== 1) throw new Error('INSUFFICIENT_STOCK');
    }
  }

  private areOptionsValid(item: CheckoutItem): boolean {
    const selected = item.selectedOptions ?? [];
    if (new Set(selected).size !== selected.length) return false;

    const optionValues = item.productOptions.map((option) => ({
      isRequired: option.isRequired,
      values: this.toSelectedOptions(option.values) ?? [],
    }));
    if (
      selected.some(
        (value) =>
          !optionValues.some((option) => option.values.includes(value)),
      )
    ) {
      return false;
    }
    return optionValues.every(
      (option) =>
        !option.isRequired ||
        option.values.some((value) => selected.includes(value)),
    );
  }

  private async prepareCouponRedemption(
    tx: Prisma.TransactionClient,
    userId: string,
    couponClaimId: string | undefined,
    couponCode: string | undefined,
    subtotal: Prisma.Decimal,
    items: CheckoutItem[],
  ): Promise<{
    claimId: string;
    id: string;
    code: string;
    discountType: DiscountType;
    discountValue: Prisma.Decimal;
    discountAmount: Prisma.Decimal;
    appliedItem: { unitPrice: Prisma.Decimal };
  } | null> {
    if (!couponClaimId && !couponCode?.trim()) return null;
    if (couponClaimId && couponCode?.trim()) throw new Error('INVALID_COUPON');

    const claim = await tx.couponClaim.findFirst({
      where: {
        userId,
        usedAt: null,
        ...(couponClaimId
          ? { id: couponClaimId }
          : { coupon: { code: couponCode!.trim().toUpperCase() } }),
      },
      include: { coupon: true },
    });
    if (!claim) throw new Error('INVALID_COUPON');
    const now = new Date();
    let calculation: CouponCalculation;
    try {
      calculation = calculateCouponDiscount(claim.coupon, subtotal, items, now);
    } catch {
      throw new Error('INVALID_COUPON');
    }

    return {
      claimId: claim.id,
      id: claim.coupon.id,
      code: claim.coupon.code,
      discountType: claim.coupon.discountType,
      discountValue: claim.coupon.discountValue,
      discountAmount: calculation.discountAmount,
      appliedItem: { unitPrice: calculation.appliedItem.unitPrice },
    };
  }

  private async markCouponClaimUsed(
    tx: Prisma.TransactionClient,
    userId: string,
    couponClaimId: string,
    orderId: string,
  ) {
    const now = new Date();
    const redemption = await tx.couponClaim.updateMany({
      where: {
        id: couponClaimId,
        userId,
        usedAt: null,
        coupon: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      },
      data: { usedAt: now, orderId },
    });
    if (redemption.count !== 1) throw new Error('INVALID_COUPON');
  }

  private toSelectedOptions(value: Prisma.JsonValue | null): string[] | null {
    if (!Array.isArray(value)) return null;
    const values = value.filter(
      (item): item is string => typeof item === 'string',
    );
    return values.length === value.length ? values : null;
  }
}
