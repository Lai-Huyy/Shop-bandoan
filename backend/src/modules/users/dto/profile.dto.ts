import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName?: string;
  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
  @ApiPropertyOptional({ description: 'HTTPS avatar URL' })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  avatarUrl?: string;
}
export class ChangePasswordDto {
  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  currentPassword: string;
  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  newPassword: string;
}
export class CreateAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  recipientName: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^(?:\+84|0)\d{9,10}$/)
  recipientPhone: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  streetAddress: string;
  @ApiProperty({ maxLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  provinceCode: string;
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  provinceName: string;
  @ApiProperty({ maxLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  wardCode: string;
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  wardName: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}
export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
