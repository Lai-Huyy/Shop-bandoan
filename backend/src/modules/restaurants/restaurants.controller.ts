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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { FindRestaurantsQueryDto } from './dto/find-restaurants-query.dto';
import {
  PaginatedRestaurantsResponseDto,
  RestaurantResponseDto,
} from './dto/restaurant-response.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantsService } from './restaurants.service';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a restaurant' })
  @ApiCreatedResponse({
    description: 'Restaurant successfully created',
    type: RestaurantResponseDto,
  })
  @ApiConflictResponse({ description: 'Restaurant slug already exists' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Administrator role is required' })
  create(@Body() dto: CreateRestaurantDto) {
    return this.restaurantsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List restaurants with pagination and search' })
  @ApiOkResponse({
    description: 'Paginated list of non-deleted restaurants',
    type: PaginatedRestaurantsResponseDto,
  })
  findAll(@Query() query: FindRestaurantsQueryDto) {
    return this.restaurantsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a restaurant by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: RestaurantResponseDto })
  @ApiNotFoundResponse({ description: 'Restaurant not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a restaurant' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: RestaurantResponseDto })
  @ApiConflictResponse({ description: 'Restaurant slug already exists' })
  @ApiNotFoundResponse({ description: 'Restaurant not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Administrator role is required' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a restaurant' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Restaurant successfully deleted' })
  @ApiNotFoundResponse({ description: 'Restaurant not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Administrator role is required' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.restaurantsService.remove(id);
  }
}
