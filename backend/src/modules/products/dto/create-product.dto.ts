import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductStatus } from '../../../../generated/prisma';
import { ProductImageDto } from './product-image.dto';
import { ProductOptionDto } from './product-option.dto';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DECIMAL_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export class CreateProductDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'spicy-beef-noodle', maxLength: 220 })
  @IsString()
  @MaxLength(220)
  @Matches(SLUG_PATTERN, {
    message: 'slug must use lowercase letters, numbers, and hyphens only',
  })
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '79000.00', pattern: DECIMAL_PATTERN.source })
  @Matches(DECIMAL_PATTERN, {
    message: 'basePrice must be a non-negative decimal with up to two places',
  })
  basePrice: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;

  @ApiProperty({
    minimum: 0,
    description: 'Physical quantity available for sale',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity: number;

  @ApiPropertyOptional({
    enum: ProductStatus,
    default: ProductStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ type: ProductImageDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @ApiPropertyOptional({ type: ProductOptionDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionDto)
  options?: ProductOptionDto[];
}
