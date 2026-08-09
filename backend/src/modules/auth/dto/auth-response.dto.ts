import { ApiProperty } from '@nestjs/swagger';

export class AuthenticatedUserDto {
  @ApiProperty({ example: '8a9df027-5f72-49d4-bdbb-b219f6546215' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: 'CUSTOMER' })
  role: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthenticatedUserDto })
  user: AuthenticatedUserDto;

  @ApiProperty({
    description: 'Short-lived bearer token for Authorization requests.',
  })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({
    example: 900,
    description: 'Access-token lifetime in seconds.',
  })
  expiresIn: number;
}
