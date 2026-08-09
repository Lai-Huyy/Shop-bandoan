import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DiscountType } from '../../../../generated/prisma';

const DECIMAL = /^\d+(?:\.\d{1,2})?$/;

export class CreateCouponDto {
  @ApiProperty() @IsString() @MaxLength(50) code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty() @Matches(DECIMAL) discountValue: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DECIMAL)
  minOrderSubtotal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DECIMAL)
  maxDiscountAmount?: string;

  @ApiPropertyOptional({
    minimum: 1,
    description:
      'Total coupons that can be claimed. Required unless the deprecated maxRedemptions alias is sent.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  couponQuantity?: number;

  @ApiPropertyOptional({
    deprecated: true,
    description: 'Compatibility alias for couponQuantity.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional({ description: 'Null means every category.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number | null;

  @ApiProperty() @IsDateString() startDate: string;
  @ApiProperty() @IsDateString() endDate: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}

export class CouponPreviewDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'A coupon claimed by the current user.',
  })
  @IsOptional()
  @IsUUID()
  couponClaimId?: string;

  @ApiPropertyOptional({
    maxLength: 50,
    deprecated: true,
    description:
      'Compatibility lookup. It still requires an unused owned claim.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  cartItemIds?: string[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  directProductId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  directQuantity?: number;
}

export class CouponCheckoutOptionsDto {
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  cartItemIds?: string[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  directProductId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  directQuantity?: number;
}

export class FindCouponsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
