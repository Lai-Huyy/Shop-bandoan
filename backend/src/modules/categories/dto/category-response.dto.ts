import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiPropertyOptional()
  imageUrl: string | null;

  @ApiProperty()
  isDisplayed: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiPropertyOptional()
  parentId: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class CategoryPaginationMetaDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginatedCategoriesResponseDto {
  @ApiProperty({ type: CategoryResponseDto, isArray: true })
  items: CategoryResponseDto[];

  @ApiProperty({ type: CategoryPaginationMetaDto })
  meta: CategoryPaginationMetaDto;
}
