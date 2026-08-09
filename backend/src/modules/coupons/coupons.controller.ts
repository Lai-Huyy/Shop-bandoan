import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CouponsService } from './coupons.service';
import {
  CouponCheckoutOptionsDto,
  CouponPreviewDto,
  CreateCouponDto,
  FindCouponsQueryDto,
  UpdateCouponDto,
} from './dto/coupon.dto';

@ApiTags('Coupons')
@ApiBearerAuth()
@Controller('coupons')
export class CouponsController {
  constructor(private readonly service: CouponsService) {}

  @Get('available')
  @ApiOperation({
    summary: 'List active coupons that the current user may claim',
  })
  available(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FindCouponsQueryDto,
  ) {
    return this.service.findAvailable(user.id, query);
  }

  @Get('my')
  @ApiOperation({ summary: 'List coupons claimed by the current user' })
  mine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FindCouponsQueryDto,
  ) {
    return this.service.findMyClaims(user.id, query);
  }

  @Post('checkout-options')
  @ApiOperation({
    summary: 'List and rank the current user’s owned coupons for checkout',
  })
  @ApiBadRequestResponse({
    description: 'The selected cart or direct product is invalid',
  })
  checkoutOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CouponCheckoutOptionsDto,
  ) {
    return this.service.checkoutOptions(user.id, dto);
  }

  @Post('preview')
  @ApiOperation({
    summary: 'Preview one claimed coupon against selected items',
  })
  @ApiBadRequestResponse({
    description: 'Coupon has been used or cannot be applied',
  })
  @ApiNotFoundResponse({
    description: 'Claimed coupon or selected items not found',
  })
  preview(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CouponPreviewDto,
  ) {
    return this.service.preview(user.id, dto);
  }

  @Post(':id/claim')
  @ApiOperation({ summary: 'Claim one available coupon for the current user' })
  @ApiBadRequestResponse({
    description: 'Coupon is unavailable or the user owns 10 coupons',
  })
  @ApiConflictResponse({
    description: 'Coupon was already claimed by this user',
  })
  claim(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.claim(user.id, id);
  }

  @Get('analytics')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get coupon claim and redemption analytics' })
  analytics() {
    return this.service.getAnalytics();
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List coupons for administration' })
  list(@Query() query: FindCouponsQueryDto) {
    return this.service.findAll(query);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a coupon with a total claim quantity' })
  @ApiConflictResponse({ description: 'Coupon code already exists' })
  create(@Body() dto: CreateCouponDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get coupon administration detail' })
  get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Update a coupon without invalidating existing claims',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Deactivate a coupon while retaining claim history',
  })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.remove(id);
  }
}
