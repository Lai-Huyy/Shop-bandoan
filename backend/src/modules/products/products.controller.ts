import {
  Body,
  BadRequestException,
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
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
import { ProductsService } from './products.service';
import {
  MAX_PRODUCT_IMAGE_SIZE,
  ProductImageUploadService,
} from './product-image-upload.service';
import type { ProductImageUploadFile } from './product-image-upload.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import {
  ProductImageDto,
  UpdateProductImageDto,
} from './dto/product-image.dto';
import {
  ProductOptionDto,
  UpdateProductOptionDto,
} from './dto/product-option.dto';
import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const productImageUploadInterceptor = FileInterceptor('image', {
  limits: { fileSize: MAX_PRODUCT_IMAGE_SIZE, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!ProductImageUploadService.isSupportedMimeType(file.mimetype)) {
      callback(
        new BadRequestException('Only JPEG, PNG, and WebP images are allowed'),
        false,
      );
      return;
    }
    callback(null, true);
  },
});

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiBearerAuth()
  @UseInterceptors(productImageUploadInterceptor)
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [{ $ref: '#/components/schemas/CreateProductDto' }],
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary: 'Create a product with an optional local image upload',
  })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @ApiConflictResponse({ description: 'Product slug already exists' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Administrator role is required' })
  @ApiBadRequestResponse({
    description: 'Product image must be JPEG, PNG, or WebP and at most 5 MB',
  })
  create(
    @Body() dto: CreateProductDto,
    @UploadedFile() image?: ProductImageUploadFile,
  ) {
    return this.productsService.create(dto, image);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List available products with search, filters, and pagination',
  })
  @ApiOkResponse({ type: PaginatedProductsResponseDto })
  @ApiBadRequestResponse({ description: 'Price filter range is invalid' })
  findAll(@Query() query: FindProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('admin')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List products for administration' })
  @ApiOkResponse({ type: PaginatedProductsResponseDto })
  @ApiBadRequestResponse({ description: 'Price filter range is invalid' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Administrator role is required' })
  findAllForAdministration(@Query() query: FindProductsQueryDto) {
    return this.productsService.findAll(query, false);
  }

  @Get('admin/:id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a product for administration' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Administrator role is required' })
  findOneForAdministration(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.findOne(id, false);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get an available product detail by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ description: 'Product not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @UseInterceptors(productImageUploadInterceptor)
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [{ $ref: '#/components/schemas/UpdateProductDto' }],
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary: 'Update a product with an optional local image upload',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiConflictResponse({ description: 'Product slug already exists' })
  @ApiNotFoundResponse({ description: 'Product or category not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Administrator role is required' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile() image?: ProductImageUploadFile,
  ) {
    return this.productsService.update(id, dto, image);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Permanently delete a product without order history',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Product permanently deleted' })
  @ApiConflictResponse({
    description: 'Product has order history and cannot be deleted',
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Administrator role is required' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/images')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add an HTTPS image URL to a product' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Product image successfully created' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  createImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ProductImageDto,
  ) {
    return this.productsService.createImage(id, dto);
  }

  @Patch(':id/images/:imageId')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product image' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'imageId', format: 'uuid' })
  @ApiOkResponse({ description: 'Product image successfully updated' })
  @ApiNotFoundResponse({ description: 'Product or product image not found' })
  updateImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.productsService.updateImage(id, imageId, dto);
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product image' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'imageId', format: 'uuid' })
  @ApiOkResponse({ description: 'Product image successfully deleted' })
  @ApiNotFoundResponse({ description: 'Product or product image not found' })
  removeImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
  ) {
    return this.productsService.removeImage(id, imageId);
  }

  @Post(':id/options')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a selectable option to a product' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Product option successfully created' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  createOption(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ProductOptionDto,
  ) {
    return this.productsService.createOption(id, dto);
  }

  @Patch(':id/options/:optionId')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product option' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'optionId', format: 'uuid' })
  @ApiOkResponse({ description: 'Product option successfully updated' })
  @ApiNotFoundResponse({ description: 'Product or product option not found' })
  updateOption(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('optionId', new ParseUUIDPipe()) optionId: string,
    @Body() dto: UpdateProductOptionDto,
  ) {
    return this.productsService.updateOption(id, optionId, dto);
  }

  @Delete(':id/options/:optionId')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product option' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'optionId', format: 'uuid' })
  @ApiOkResponse({ description: 'Product option successfully deleted' })
  @ApiNotFoundResponse({ description: 'Product or product option not found' })
  removeOption(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('optionId', new ParseUUIDPipe()) optionId: string,
  ) {
    return this.productsService.removeOption(id, optionId);
  }
}
