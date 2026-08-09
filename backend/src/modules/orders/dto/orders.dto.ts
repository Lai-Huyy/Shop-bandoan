import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { OrderStatus, PaymentStatus } from '../../../../generated/prisma';

export const customerOrderSorts = ['newest', 'oldest'] as const;
export const adminOrderSorts = [
  'newest',
  'oldest',
  'highest-total',
  'lowest-total',
  'total',
] as const;

export class OrderPaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;
}

export class OrdersQueryDto extends OrderPaginationQueryDto {
  @ApiPropertyOptional({ enum: customerOrderSorts, default: 'newest' })
  @IsOptional()
  @IsIn(customerOrderSorts)
  sort: (typeof customerOrderSorts)[number] = 'newest';
}

export class AdminOrdersQueryDto extends OrderPaginationQueryDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ format: 'date', example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ format: 'date', example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: adminOrderSorts, default: 'newest' })
  @IsOptional()
  @IsIn(adminOrderSorts)
  sort: (typeof adminOrderSorts)[number] = 'newest';
}

export class UpdateOrderStatusDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
