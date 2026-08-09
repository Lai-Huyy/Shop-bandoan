import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountType, Prisma } from '../../../generated/prisma';
import {
  calculateCouponDiscount,
  CouponCalculationError,
  type CouponCalculation,
} from './coupon-calculator';
import { CouponsRepository, type CouponItemSource } from './coupons.repository';
import {
  CouponCheckoutOptionsDto,
  CouponPreviewDto,
  CreateCouponDto,
  FindCouponsQueryDto,
  UpdateCouponDto,
} from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly repository: CouponsRepository) {}

  async create(dto: CreateCouponDto) {
    this.validateDates(dto.startDate, dto.endDate);
    this.validateDiscount(dto.discountType, dto.discountValue);
    await this.ensureCategoryExists(dto.categoryId);
    const couponQuantity = this.resolveCouponQuantity(dto);

    try {
      return await this.repository.create({
        code: dto.code.toUpperCase(),
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderSubtotal: dto.minOrderSubtotal ?? '0',
        maxDiscountAmount: dto.maxDiscountAmount,
        maxRedemptions: couponQuantity,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? true,
        categoryId: dto.categoryId ?? null,
      });
    } catch (error) {
      if (this.isPrismaError(error, 'P2002')) {
        throw new ConflictException('Coupon code already exists');
      }
      throw error;
    }
  }

  async claim(userId: string, couponId: string) {
    try {
      return await this.repository.claim(userId, couponId);
    } catch (error) {
      if (this.isPrismaError(error, 'P2002')) {
        throw new ConflictException('You have already claimed this coupon');
      }
      if (
        error instanceof Error &&
        error.message === 'MAX_COUPON_CLAIMS_REACHED'
      ) {
        throw new BadRequestException('You can claim at most 10 coupons');
      }
      if (error instanceof Error && error.message === 'COUPON_NOT_AVAILABLE') {
        throw new BadRequestException('Coupon is no longer available');
      }
      throw error;
    }
  }

  async preview(userId: string, dto: CouponPreviewDto) {
    this.ensureItemSource(dto);
    const claim = await this.findOwnedClaim(userId, dto);
    if (!claim) throw new NotFoundException('Claimed coupon not found');
    if (claim.usedAt)
      throw new BadRequestException('Coupon has already been used');

    const { items, subtotal } = await this.getItemsAndSubtotal(userId, dto);
    const calculation = this.calculate(claim.coupon, subtotal, items);
    return this.toPreview(claim.id, claim.coupon, subtotal, calculation);
  }

  async checkoutOptions(userId: string, dto: CouponCheckoutOptionsDto) {
    this.ensureItemSource(dto);
    const { items, subtotal } = await this.getItemsAndSubtotal(userId, dto);
    const claims = await this.repository.findUsableClaimsForCheckout(userId);
    const options = claims.map((claim) => {
      try {
        const calculation = calculateCouponDiscount(
          claim.coupon,
          subtotal,
          items,
        );
        return {
          couponClaimId: claim.id,
          coupon: claim.coupon,
          isApplicable: true,
          reason: null,
          calculation,
        };
      } catch (error) {
        return {
          couponClaimId: claim.id,
          coupon: claim.coupon,
          isApplicable: false,
          reason: this.getCalculationMessage(error),
          calculation: null,
        };
      }
    });

    options.sort((left, right) => {
      if (left.isApplicable !== right.isApplicable) {
        return left.isApplicable ? -1 : 1;
      }
      const discountComparison = (
        right.calculation?.discountAmount ?? new Prisma.Decimal(0)
      ).comparedTo(left.calculation?.discountAmount ?? new Prisma.Decimal(0));
      if (discountComparison) return discountComparison;
      const expiryComparison =
        left.coupon.endDate.getTime() - right.coupon.endDate.getTime();
      if (expiryComparison) return expiryComparison;
      return right.coupon.minOrderSubtotal.comparedTo(
        left.coupon.minOrderSubtotal,
      );
    });

    return options.map((option) => ({
      couponClaimId: option.couponClaimId,
      code: option.coupon.code,
      description: option.coupon.description,
      discountType: option.coupon.discountType,
      discountValue: option.coupon.discountValue.toFixed(2),
      minOrderSubtotal: option.coupon.minOrderSubtotal.toFixed(2),
      endDate: option.coupon.endDate,
      isApplicable: option.isApplicable,
      reason: option.reason,
      ...(option.calculation
        ? {
            appliedProductId: option.calculation.appliedItem.productId,
            appliedProductName: option.calculation.appliedItem.productName,
            discountAmount: option.calculation.discountAmount.toFixed(2),
            totalAmount: subtotal
              .minus(option.calculation.discountAmount)
              .toFixed(2),
          }
        : { discountAmount: '0.00', totalAmount: subtotal.toFixed(2) }),
    }));
  }

  async findAvailable(userId: string, query: FindCouponsQueryDto) {
    const result = await this.repository.findAvailableForUser(
      userId,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      items: result.items.map((coupon) => ({
        ...this.toCoupon(coupon),
        remainingQuantity:
          coupon.maxRedemptions === null
            ? null
            : Math.max(0, coupon.maxRedemptions - coupon.currentRedemptions),
        hasClaimed: coupon.claims.length > 0,
      })),
      meta: this.pagination(query, result.totalItems),
    };
  }

  async findMyClaims(userId: string, query: FindCouponsQueryDto) {
    const result = await this.repository.findClaimsForUser(
      userId,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      items: result.items.map((claim) => ({
        id: claim.id,
        claimedAt: claim.claimedAt,
        usedAt: claim.usedAt,
        status: this.getClaimStatus(claim.usedAt, claim.coupon),
        coupon: this.toCoupon(claim.coupon),
      })),
      meta: this.pagination(query, result.totalItems),
    };
  }

  async findAll(query: FindCouponsQueryDto) {
    const result = await this.repository.findAll(
      (query.page - 1) * query.limit,
      query.limit,
      query.search,
      query.isActive,
    );
    return {
      items: result.items.map((coupon) => ({
        ...this.toCoupon(coupon),
        claimedCount: coupon.claimedCount,
        usedCount: coupon.usedCount,
        remainingQuantity: coupon.remainingQuantity,
      })),
      meta: this.pagination(query, result.totalItems),
    };
  }

  getAnalytics() {
    return this.repository.getAnalytics();
  }

  async findOne(id: string) {
    const coupon = await this.repository.findById(id);
    if (!coupon) throw new NotFoundException('Coupon not found');
    return this.toCoupon(coupon);
  }

  async update(id: string, dto: UpdateCouponDto) {
    const existing = await this.findOne(id);
    const startDate = dto.startDate ?? existing.startDate.toISOString();
    const endDate = dto.endDate ?? existing.endDate.toISOString();
    this.validateDates(startDate, endDate);
    if (dto.discountValue !== undefined) {
      this.validateDiscount(
        dto.discountType ?? existing.discountType,
        dto.discountValue,
      );
    }
    await this.ensureCategoryExists(dto.categoryId);
    const couponQuantity = this.resolveCouponQuantity(
      dto,
      existing.currentRedemptions,
    );

    return this.repository.update(id, {
      ...(dto.code ? { code: dto.code.toUpperCase() } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.discountType ? { discountType: dto.discountType } : {}),
      ...(dto.discountValue !== undefined
        ? { discountValue: dto.discountValue }
        : {}),
      ...(dto.minOrderSubtotal !== undefined
        ? { minOrderSubtotal: dto.minOrderSubtotal }
        : {}),
      ...(dto.maxDiscountAmount !== undefined
        ? { maxDiscountAmount: dto.maxDiscountAmount }
        : {}),
      ...(couponQuantity !== undefined
        ? { maxRedemptions: couponQuantity }
        : {}),
      ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
      ...(dto.endDate ? { endDate: new Date(dto.endDate) } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.categoryId !== undefined
        ? { categoryId: dto.categoryId ?? null }
        : {}),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repository.deactivate(id);
    return { message: 'Coupon successfully deactivated' };
  }

  private async findOwnedClaim(userId: string, dto: CouponPreviewDto) {
    if (dto.couponClaimId) {
      return this.repository.findClaimById(userId, dto.couponClaimId);
    }
    return this.repository.findClaimByCouponCode(
      userId,
      dto.code!.toUpperCase(),
    );
  }

  private async getItemsAndSubtotal(userId: string, input: CouponItemSource) {
    const items = await this.repository.findPreviewItems(userId, input);
    if (!items) throw new NotFoundException('Selected products not found');
    return {
      items,
      subtotal: items.reduce(
        (total, item) => total.plus(item.unitPrice.mul(item.quantity)),
        new Prisma.Decimal(0),
      ),
    };
  }

  private calculate(
    coupon: Parameters<typeof calculateCouponDiscount>[0],
    subtotal: Prisma.Decimal,
    items: Awaited<
      ReturnType<CouponsRepository['findPreviewItems']>
    > extends infer Result
      ? Exclude<Result, null>
      : never,
  ): CouponCalculation {
    try {
      return calculateCouponDiscount(coupon, subtotal, items);
    } catch (error) {
      throw new BadRequestException(this.getCalculationMessage(error));
    }
  }

  private toPreview(
    couponClaimId: string,
    coupon: Parameters<typeof calculateCouponDiscount>[0],
    subtotal: Prisma.Decimal,
    calculation: CouponCalculation,
  ) {
    return {
      couponClaimId,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toFixed(2),
      appliedProductId: calculation.appliedItem.productId,
      appliedProductName: calculation.appliedItem.productName,
      appliedUnitPrice: calculation.appliedItem.unitPrice.toFixed(2),
      discountAmount: calculation.discountAmount.toFixed(2),
      totalAmount: subtotal.minus(calculation.discountAmount).toFixed(2),
    };
  }

  private toCoupon(coupon: {
    id: string;
    code: string;
    description: string | null;
    discountType: DiscountType;
    discountValue: Prisma.Decimal;
    minOrderSubtotal: Prisma.Decimal;
    maxDiscountAmount: Prisma.Decimal | null;
    maxRedemptions: number | null;
    currentRedemptions: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    categoryId: number | null;
    category?: { id: number; name: string } | null;
  }) {
    return {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toFixed(2),
      minOrderSubtotal: coupon.minOrderSubtotal.toFixed(2),
      maxDiscountAmount: coupon.maxDiscountAmount?.toFixed(2) ?? null,
      couponQuantity: coupon.maxRedemptions,
      maxRedemptions: coupon.maxRedemptions,
      currentRedemptions: coupon.currentRedemptions,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      isActive: coupon.isActive,
      categoryId: coupon.categoryId,
      ...(coupon.category !== undefined ? { category: coupon.category } : {}),
    };
  }

  private getClaimStatus(
    usedAt: Date | null,
    coupon: { isActive: boolean; startDate: Date; endDate: Date },
  ) {
    if (usedAt) return 'USED';
    if (coupon.endDate < new Date()) return 'EXPIRED';
    if (!coupon.isActive || coupon.startDate > new Date()) return 'INACTIVE';
    return 'AVAILABLE';
  }

  private ensureItemSource(input: CouponItemSource) {
    if (Boolean(input.cartItemIds?.length) === Boolean(input.directProductId)) {
      throw new BadRequestException('Provide cart items or one direct product');
    }
  }

  private validateDates(startDate: string, endDate: string) {
    if (new Date(startDate) >= new Date(endDate)) {
      throw new BadRequestException('startDate must be before endDate');
    }
  }

  private validateDiscount(type: DiscountType, value: string) {
    const discount = new Prisma.Decimal(value);
    if (discount.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Discount value must be greater than zero');
    }
    if (type === DiscountType.PERCENTAGE && discount.greaterThan(100)) {
      throw new BadRequestException('Percentage discount must not exceed 100');
    }
  }

  private resolveCouponQuantity(
    dto: Pick<CreateCouponDto, 'couponQuantity' | 'maxRedemptions'>,
    currentRedemptions?: number,
  ) {
    if (
      dto.couponQuantity !== undefined &&
      dto.maxRedemptions !== undefined &&
      dto.couponQuantity !== dto.maxRedemptions
    ) {
      throw new BadRequestException('Coupon quantity values must match');
    }
    const quantity = dto.couponQuantity ?? dto.maxRedemptions;
    if (quantity === undefined && currentRedemptions === undefined) {
      throw new BadRequestException('Coupon quantity is required');
    }
    if (
      quantity !== undefined &&
      currentRedemptions !== undefined &&
      quantity < currentRedemptions
    ) {
      throw new BadRequestException(
        'Coupon quantity cannot be lower than claimed coupons',
      );
    }
    return quantity;
  }

  private async ensureCategoryExists(categoryId?: number | null) {
    if (categoryId && !(await this.repository.categoryExists(categoryId))) {
      throw new NotFoundException('Coupon category not found');
    }
  }

  private pagination(query: FindCouponsQueryDto, totalItems: number) {
    return {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / query.limit),
    };
  }

  private getCalculationMessage(error: unknown) {
    if (error instanceof CouponCalculationError) {
      const messages: Record<string, string> = {
        COUPON_INACTIVE: 'Coupon is inactive',
        COUPON_NOT_STARTED: 'Coupon is not active yet',
        COUPON_EXPIRED: 'Coupon has expired',
        MINIMUM_ORDER_NOT_REACHED: 'Minimum order value has not been reached',
        NO_ELIGIBLE_PRODUCT: 'No selected product matches this coupon',
      };
      return messages[error.code];
    }
    return 'Coupon is not applicable';
  }

  private isPrismaError(error: unknown, code: string) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === code
    );
  }
}
