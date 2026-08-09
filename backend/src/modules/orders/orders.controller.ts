import {
  Body,
  Controller,
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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  AdminOrdersQueryDto,
  OrdersQueryDto,
  UpdateOrderStatusDto,
} from './dto/orders.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller()
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get('orders')
  @ApiOperation({ summary: 'List the current customer orders' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: OrdersQueryDto) {
    return this.service.customerList(user.id, query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get an owned order detail with history' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.customerDetail(user.id, id);
  }

  @Post('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel an eligible owned order' })
  @ApiOkResponse({ description: 'Order cancelled and history recorded' })
  @ApiBadRequestResponse({
    description: 'Order cannot be cancelled in its current status',
  })
  @ApiNotFoundResponse({ description: 'Order not found' })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.cancel(user.id, id);
  }

  @Post('orders/:id/buy-again')
  @ApiOperation({
    summary: 'Add available items from an owned order back to the cart',
  })
  @ApiOkResponse({ description: 'Cart updated from order items' })
  @ApiNotFoundResponse({
    description: 'Order or an ordered product is unavailable',
  })
  buyAgain(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.buyAgain(user.id, id);
  }

  @Get('admin/orders/summary')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get real order operational summary statistics' })
  adminSummary() {
    return this.service.adminSummary();
  }

  @Get('admin/orders')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'List all orders with search, filters, and sorting',
  })
  adminList(@Query() query: AdminOrdersQueryDto) {
    return this.service.adminList(query);
  }

  @Get('admin/orders/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get an order operational detail' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  adminDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.adminDetail(id);
  }

  @Patch('admin/orders/:id/status')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Advance or cancel an order using the allowed workflow',
  })
  @ApiBadRequestResponse({ description: 'Invalid order status transition' })
  @ApiForbiddenResponse({ description: 'Order was changed by another request' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateStatus(user.id, id, dto.status);
  }
}
