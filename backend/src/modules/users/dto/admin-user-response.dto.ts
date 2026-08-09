import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../../generated/prisma';

export class AdminUserAddressResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  label: string | null;

  @ApiProperty()
  recipientName: string;

  @ApiProperty()
  recipientPhone: string;

  @ApiProperty()
  streetAddress: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  isDefault: boolean;
}

export class AdminUserResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ description: 'HTTPS avatar URL' })
  avatarUrl: string | null;

  @ApiProperty()
  username: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone: string | null;

  @ApiProperty({ example: 'CUSTOMER' })
  role: string;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class AdminUserDetailResponseDto extends AdminUserResponseDto {
  @ApiProperty({ type: AdminUserAddressResponseDto, isArray: true })
  addresses: AdminUserAddressResponseDto[];

  @ApiProperty({ description: 'Number of orders' })
  orderCount: number;
}

export class AdminUserPaginationMetaDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginatedAdminUsersResponseDto {
  @ApiProperty({ type: AdminUserResponseDto, isArray: true })
  items: AdminUserResponseDto[];

  @ApiProperty({ type: AdminUserPaginationMetaDto })
  meta: AdminUserPaginationMetaDto;
}
