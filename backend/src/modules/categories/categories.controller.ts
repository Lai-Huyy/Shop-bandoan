import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  CategoryResponseDto,
  PaginatedCategoriesResponseDto,
} from './dto/category-response.dto';
import { FindCategoriesQueryDto } from './dto/find-categories-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a category' })
  @ApiCreatedResponse({
    description: 'Category successfully created',
    type: CategoryResponseDto,
  })
  @ApiConflictResponse({ description: 'Category slug already exists' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Administrator role is required' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List visible categories with pagination and search',
  })
  @ApiOkResponse({ type: PaginatedCategoriesResponseDto })
  findAll(@Query() query: FindCategoriesQueryDto) {
    return this.categoriesService.findAll(query);
  }

  @Get('admin')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all categories for administration' })
  @ApiOkResponse({ type: PaginatedCategoriesResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Administrator role is required' })
  findAllForAdministration(@Query() query: FindCategoriesQueryDto) {
    return this.categoriesService.findAll(query, true);
  }

  @Get('admin/:id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a category for administration' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Administrator role is required' })
  findOneForAdministration(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id, true);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a visible category by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiConflictResponse({
    description: 'Category slug already exists or parent is invalid',
  })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Administrator role is required' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hide a category from public discovery' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Category successfully hidden' })
  @ApiNotFoundResponse({ description: 'Category not found or already hidden' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Administrator role is required' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
