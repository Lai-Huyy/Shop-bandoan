import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuthenticatedUserDto } from '../auth/dto/auth-response.dto';
import { UsersService } from './users.service';
import {
  ChangePasswordDto,
  CreateAddressDto,
  UpdateAddressDto,
  UpdateProfileDto,
} from './dto/profile.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiOkResponse({ type: AuthenticatedUserDto })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
  })
  getCurrentUser(@CurrentUser() user: AuthenticatedUser): AuthenticatedUserDto {
    return this.usersService.getCurrentUser(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }
  @Patch('change-password')
  @ApiOperation({ summary: 'Change the current user password' })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto);
  }
  @Get('addresses')
  @ApiOperation({ summary: 'List current user addresses' })
  listAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listAddresses(user.id);
  }
  @Post('addresses')
  @ApiOperation({ summary: 'Create an address for the current user' })
  createAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(user.id, dto);
  }
  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update a current user address' })
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.id, id, dto);
  }
  @Delete('addresses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a current user address' })
  deleteAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.usersService.deleteAddress(user.id, id);
  }
}
