import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CheckoutsService } from './checkouts.service';
import { CheckoutDto } from './dto/checkout.dto';
@ApiTags('Checkout')
@ApiBearerAuth()
@Controller('checkout')
export class CheckoutsController {
  constructor(private readonly service: CheckoutsService) {}
  @Post()
  @ApiOperation({
    summary:
      'Checkout selected cart items or one direct product using cash on delivery',
  })
  @ApiCreatedResponse({
    description:
      'Order, immutable shipping snapshot, and pending COD payment created',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid checkout source, unavailable product, selected options, or coupon',
  })
  @ApiNotFoundResponse({
    description: 'Shipping address or selected cart items not found',
  })
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    return this.service.checkout(user.id, dto);
  }
}
