import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RestaurantResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  address: string;

  @ApiPropertyOptional()
  phone: string | null;

  @ApiPropertyOptional()
  imageUrl: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class RestaurantPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 42 })
  totalItems: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class PaginatedRestaurantsResponseDto {
  @ApiProperty({ type: RestaurantResponseDto, isArray: true })
  items: RestaurantResponseDto[];

  @ApiProperty({ type: RestaurantPaginationMetaDto })
  meta: RestaurantPaginationMetaDto;
}
