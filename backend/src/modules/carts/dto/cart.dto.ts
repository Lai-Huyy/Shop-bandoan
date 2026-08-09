import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Selected product-option values',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptions?: string[];

  @ApiProperty({ minimum: 1, maximum: 100, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quantity = 1;
}

export class UpdateCartItemDto {
  @ApiProperty({ minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;
}

export class CartItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: string;

  @ApiProperty()
  lineTotal: string;

  @ApiPropertyOptional({ type: [String] })
  selectedOptions: string[] | null;

  @ApiProperty()
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    stockQuantity: number;
  };
}

export class CartResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: CartItemResponseDto, isArray: true })
  items: CartItemResponseDto[];

  @ApiProperty()
  subtotal: string;

  @ApiProperty()
  itemCount: number;
}
