import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../../../../generated/prisma';

export class ProductCategoryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class ProductImageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  altText: string | null;

  @ApiProperty()
  isPrimary: boolean;

  @ApiProperty()
  sortOrder: number;
}

export class ProductOptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [String] })
  values: string[];

  @ApiProperty()
  isRequired: boolean;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty({ example: '79000.00' })
  basePrice: string;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty({ minimum: 0 })
  stockQuantity: number;

  @ApiProperty({ minimum: 0 })
  soldQuantity: number;

  @ApiProperty({ type: ProductCategoryResponseDto })
  category: ProductCategoryResponseDto;

  @ApiProperty({ type: ProductImageResponseDto, isArray: true })
  images: ProductImageResponseDto[];

  @ApiProperty({ type: ProductOptionResponseDto, isArray: true })
  options: ProductOptionResponseDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class ProductPaginationMetaDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginatedProductsResponseDto {
  @ApiProperty({ type: ProductResponseDto, isArray: true })
  items: ProductResponseDto[];

  @ApiProperty({ type: ProductPaginationMetaDto })
  meta: ProductPaginationMetaDto;
}
