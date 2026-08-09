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
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CartsService } from './carts.service';
import {
  AddCartItemDto,
  CartResponseDto,
  UpdateCartItemDto,
} from './dto/cart.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user cart and totals' })
  @ApiOkResponse({ type: CartResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  getCart(@CurrentUser() user: AuthenticatedUser) {
    return this.cartsService.getCart(user.id);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Add an available product to the current user cart',
  })
  @ApiCreatedResponse({ type: CartResponseDto })
  @ApiNotFoundResponse({ description: 'Available product not found' })
  @ApiBadRequestResponse({
    description: 'Requested quantity exceeds available stock',
  })
  addItem(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddCartItemDto) {
    return this.cartsService.addItem(user.id, dto);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update a cart item quantity' })
  @ApiOkResponse({ type: CartResponseDto })
  @ApiNotFoundResponse({ description: 'Cart item not found' })
  @ApiBadRequestResponse({
    description: 'Requested quantity exceeds available stock',
  })
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(user.id, itemId, dto);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an item from the current user cart' })
  @ApiOkResponse({ description: 'Cart item successfully deleted' })
  @ApiNotFoundResponse({ description: 'Cart item not found' })
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    return this.cartsService.removeItem(user.id, itemId);
  }
}
