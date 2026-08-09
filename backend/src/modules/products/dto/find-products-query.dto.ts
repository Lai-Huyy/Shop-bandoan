import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductStatus } from '../../../../generated/prisma';

const DECIMAL_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export const PRODUCT_SORT_OPTIONS = [
  'newest',
  'price-asc',
  'price-desc',
  'popular',
] as const;

export type ProductSortOption = (typeof PRODUCT_SORT_OPTIONS)[number];

export class FindProductsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ maxLength: 100 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ example: '50000.00' })
  @IsOptional()
  @Matches(DECIMAL_PATTERN)
  minPrice?: string;

  @ApiPropertyOptional({ example: '150000.00' })
  @IsOptional()
  @Matches(DECIMAL_PATTERN)
  maxPrice?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: PRODUCT_SORT_OPTIONS, default: 'newest' })
  @IsOptional()
  @IsIn(PRODUCT_SORT_OPTIONS)
  sort?: ProductSortOption;
}
