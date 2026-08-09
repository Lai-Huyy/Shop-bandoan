import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    example: 'john_doe',
    description: 'Username or email used to authenticate.',
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(255)
  identifier?: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Deprecated email-only login field. Use identifier instead.',
    deprecated: true,
  })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
