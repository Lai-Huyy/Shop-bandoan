import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface CouponItemSource {
  cartItemIds?: string[];
  directProductId?: string;
  directQuantity?: number;
}

const categorySelect = { id: true, name: true } as const;

@Injectable()
export class CouponsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CouponUncheckedCreateInput) {
    return this.prisma.coupon.create({
      data,
      include: { category: { select: categorySelect } },
    });
  }

  findById(id: string) {
    return this.prisma.coupon.findUnique({
      where: { id },
      include: { category: { select: categorySelect } },
    });
  }

  categoryExists(id: number) {
    return this.prisma.category
      .findUnique({ where: { id }, select: { id: true } })
      .then(Boolean);
  }

  async findPreviewItems(userId: string, input: CouponItemSource) {
    if (input.directProductId) {
      const product = await this.prisma.product.findFirst({
        where: { id: input.directProductId },
        select: { id: true, name: true, categoryId: true, basePrice: true },
      });
      return product
        ? [
            {
              productId: product.id,
              productName: product.name,
              categoryId: product.categoryId,
              unitPrice: product.basePrice,
              quantity: input.directQuantity ?? 1,
            },
          ]
        : null;
    }

    if (!input.cartItemIds?.length) return null;
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          where: { id: { in: input.cartItemIds } },
          include: { product: { select: { name: true, categoryId: true } } },
        },
      },
    });
    if (!cart || cart.items.length !== input.cartItemIds.length) return null;

    return cart.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      categoryId: item.product.categoryId,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    }));
  }

  findClaimById(userId: string, couponClaimId: string) {
    return this.prisma.couponClaim.findFirst({
      where: { id: couponClaimId, userId },
      include: {
        coupon: { include: { category: { select: categorySelect } } },
      },
    });
  }

  findClaimByCouponCode(userId: string, code: string) {
    return this.prisma.couponClaim.findFirst({
      where: { userId, coupon: { code } },
      include: {
        coupon: { include: { category: { select: categorySelect } } },
      },
    });
  }

  async findAvailableForUser(userId: string, skip: number, take: number) {
    const now = new Date();
    // Prisma cannot compare two model columns in a normal where input. The
    // list uses the active coupons and filters exhausted quantities below; the
    // conditional update in claim() remains the concurrency-safe authority.
    const baseWhere: Prisma.CouponWhereInput = {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.coupon.findMany({
        where: baseWhere,
        skip,
        take,
        orderBy: [{ endDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          category: { select: categorySelect },
          claims: { where: { userId }, select: { id: true } },
        },
      }),
      this.prisma.coupon.count({ where: baseWhere }),
    ]);

    return {
      items: items.filter(
        (coupon) =>
          coupon.maxRedemptions === null ||
          coupon.currentRedemptions < coupon.maxRedemptions,
      ),
      totalItems,
    };
  }

  async findClaimsForUser(userId: string, skip: number, take: number) {
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.couponClaim.findMany({
        where: { userId },
        skip,
        take,
        orderBy: [{ usedAt: 'asc' }, { claimedAt: 'desc' }],
        include: {
          coupon: { include: { category: { select: categorySelect } } },
        },
      }),
      this.prisma.couponClaim.count({ where: { userId } }),
    ]);
    return { items, totalItems };
  }

  findUsableClaimsForCheckout(userId: string) {
    const now = new Date();
    return this.prisma.couponClaim.findMany({
      where: {
        userId,
        usedAt: null,
        coupon: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      },
      orderBy: { claimedAt: 'asc' },
      include: { coupon: true },
    });
  }

  async claim(userId: string, couponId: string) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const now = new Date();
            const claimedCount = await tx.couponClaim.count({
              where: { userId },
            });
            if (claimedCount >= 10)
              throw new Error('MAX_COUPON_CLAIMS_REACHED');

            const coupon = await tx.coupon.findFirst({
              where: {
                id: couponId,
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now },
              },
              select: { id: true, maxRedemptions: true },
            });
            if (!coupon) throw new Error('COUPON_NOT_AVAILABLE');

            const reserved = await tx.coupon.updateMany({
              where: {
                id: coupon.id,
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now },
                ...(coupon.maxRedemptions === null
                  ? {}
                  : { currentRedemptions: { lt: coupon.maxRedemptions } }),
              },
              data: { currentRedemptions: { increment: 1 } },
            });
            if (reserved.count !== 1) throw new Error('COUPON_NOT_AVAILABLE');

            return tx.couponClaim.create({
              data: { couponId: coupon.id, userId },
              include: {
                coupon: { include: { category: { select: categorySelect } } },
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 2
        ) {
          continue;
        }
        throw error;
      }
    }
    throw new Error('COUPON_NOT_AVAILABLE');
  }

  update(id: string, data: Prisma.CouponUncheckedUpdateInput) {
    return this.prisma.coupon.update({
      where: { id },
      data,
      include: { category: { select: categorySelect } },
    });
  }

  deactivate(id: string) {
    return this.prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findAll(
    skip: number,
    take: number,
    search?: string,
    isActive?: boolean,
  ) {
    const where: Prisma.CouponWhereInput = {
      ...(isActive === undefined ? {} : { isActive }),
      ...(search
        ? { code: { contains: search, mode: 'insensitive' as const } }
        : {}),
    };
    const { items, totalItems, usedCounts } = await this.prisma.$transaction(
      async (tx) => {
        const [items, totalItems] = await Promise.all([
          tx.coupon.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
              category: { select: categorySelect },
              _count: { select: { claims: true } },
            },
          }),
          tx.coupon.count({ where }),
        ]);
        const usedCounts = items.length
          ? await tx.couponClaim.groupBy({
              by: ['couponId'],
              where: {
                couponId: { in: items.map((item) => item.id) },
                usedAt: { not: null },
              },
              _count: { _all: true },
            })
          : [];
        return { items, totalItems, usedCounts };
      },
    );
    const usedByCoupon = new Map(
      usedCounts.map((entry) => [entry.couponId, entry._count._all]),
    );
    return {
      items: items.map((coupon) => ({
        ...coupon,
        claimedCount: coupon._count.claims,
        usedCount: usedByCoupon.get(coupon.id) ?? 0,
        remainingQuantity:
          coupon.maxRedemptions === null
            ? null
            : Math.max(0, coupon.maxRedemptions - coupon.currentRedemptions),
      })),
      totalItems,
    };
  }

  async getAnalytics() {
    const [created, claimed, used, coupons] = await Promise.all([
      this.prisma.coupon.count(),
      this.prisma.couponClaim.count(),
      this.prisma.couponClaim.count({ where: { usedAt: { not: null } } }),
      this.prisma.coupon.findMany({
        select: { maxRedemptions: true, currentRedemptions: true },
      }),
    ]);
    return {
      couponsCreated: created,
      couponsClaimed: claimed,
      couponsUsed: used,
      remainingCoupons: coupons.reduce(
        (total, coupon) =>
          total +
          (coupon.maxRedemptions === null
            ? 0
            : Math.max(0, coupon.maxRedemptions - coupon.currentRedemptions)),
        0,
      ),
    };
  }
}
