import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateRestaurantDto {
  @ApiProperty({ example: 'Bandoan Kitchen', maxLength: 150 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'bandoan-kitchen', maxLength: 180 })
  @Transform(trimString)
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must contain lowercase letters, numbers, and hyphens only',
  })
  @MaxLength(180)
  slug: string;

  @ApiPropertyOptional({
    example: 'Vietnamese comfort food made with local ingredients.',
    maxLength: 5000,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: '123 Nguyen Hue, District 1, Ho Chi Minh City' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @ApiPropertyOptional({ example: '+84901234567', maxLength: 20 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/restaurants/bandoan.jpg',
  })
  @Transform(trimString)
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  imageUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
