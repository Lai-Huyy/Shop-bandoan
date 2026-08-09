import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class DirectCheckoutItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId: string;

  @ApiProperty({ minimum: 1, maximum: 100, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quantity = 1;

  @ApiPropertyOptional({
    type: [String],
    description: 'Selected product-option values',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptions?: string[];
}

export class CheckoutDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  addressId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Optional coupon claimed by the current user. It is redeemed atomically with checkout.',
  })
  @IsOptional()
  @IsUUID()
  couponClaimId?: string;

  @ApiPropertyOptional({
    maxLength: 50,
    deprecated: true,
    description:
      'Compatibility lookup. The current user must already own an unused claim for this code.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Cart item IDs to checkout. Mutually exclusive with directItem.',
  })
  @ValidateIf((value: CheckoutDto) => !value.directItem)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  cartItemIds?: string[];

  @ApiPropertyOptional({
    type: DirectCheckoutItemDto,
    description:
      'Single product to buy immediately. Mutually exclusive with cartItemIds.',
  })
  @ValidateIf((value: CheckoutDto) => !value.cartItemIds)
  @ValidateNested()
  @Type(() => DirectCheckoutItemDto)
  directItem?: DirectCheckoutItemDto;
}
