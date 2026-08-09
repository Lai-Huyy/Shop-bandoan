import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import {
  FindAdminUsersQueryDto,
  UpdateAdminUserDto,
  UpdateAdminUserStatusDto,
} from './dto/admin-users.dto';
import {
  AdminUserDetailResponseDto,
  AdminUserResponseDto,
  PaginatedAdminUsersResponseDto,
} from './dto/admin-user-response.dto';

@ApiTags('Admin Users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Access token is missing or invalid' })
@ApiForbiddenResponse({ description: 'Administrator role is required' })
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get()
  @ApiOperation({ summary: 'List users for administration' })
  @ApiOkResponse({ type: PaginatedAdminUsersResponseDto })
  findAll(@Query() query: FindAdminUsersQueryDto) {
    return this.usersService.findAllForAdministration(query);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get an administrative user detail' })
  @ApiOkResponse({ type: AdminUserDetailResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.findOneForAdministration(id);
  }
  @Patch(':id')
  @ApiOperation({
    summary: 'Update supported user profile, role, or status fields',
  })
  @ApiOkResponse({ type: AdminUserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid role or request data' })
  @ApiConflictResponse({
    description: 'Email or phone number is already in use',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.usersService.updateForAdministration(id, dto);
  }
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user account status' })
  @ApiOkResponse({ type: AdminUserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAdminUserStatusDto,
  ) {
    return this.usersService.updateStatusForAdministration(id, dto.status);
  }
}
