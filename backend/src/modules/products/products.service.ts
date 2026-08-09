import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProductStatus,
  type ProductImage,
  type ProductOption,
} from '../../../generated/prisma';
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
import { ProductImageUploadService } from './product-image-upload.service';
import type {
  ProductImageUploadFile,
  StoredProductImage,
} from './product-image-upload.service';
import { ProductDetails, ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly productImageUploadService: ProductImageUploadService,
  ) {}

  async create(
    dto: CreateProductDto,
    image?: ProductImageUploadFile,
  ): Promise<ProductResponseDto> {
    await this.ensureCategoryExists(dto.categoryId);
    this.ensureSinglePrimaryImage(dto.images);

    if (image && dto.images?.some((productImage) => productImage.isPrimary)) {
      throw new BadRequestException(
        'A product can have only one primary image',
      );
    }

    let storedImage: StoredProductImage | undefined;

    try {
      storedImage = image
        ? await this.productImageUploadService.store(image)
        : undefined;
      const product = await this.productsRepository.create({
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        basePrice: dto.basePrice,
        status: dto.status ?? ProductStatus.AVAILABLE,
        stockQuantity: dto.stockQuantity,
        category: { connect: { id: dto.categoryId } },
        images:
          dto.images?.length || storedImage
            ? {
                create: [
                  ...(dto.images ?? []).map((productImage) => ({
                    url: productImage.url,
                    altText: productImage.altText,
                    isPrimary: productImage.isPrimary ?? false,
                    sortOrder: productImage.sortOrder ?? 0,
                  })),
                  ...(storedImage
                    ? [
                        {
                          url: storedImage.url,
                          altText: dto.name,
                          isPrimary: true,
                          sortOrder: 0,
                        },
                      ]
                    : []),
                ],
              }
            : undefined,
        options: dto.options?.length
          ? {
              create: dto.options.map((option) => ({
                name: option.name,
                values: option.values,
                isRequired: option.isRequired ?? false,
              })),
            }
          : undefined,
      });
      return this.toResponse(product);
    } catch (error: unknown) {
      if (storedImage)
        await this.productImageUploadService.remove(storedImage.filePath);
      this.throwIfDuplicateSlug(error);
      throw error;
    }
  }

  async findAll(
    query: FindProductsQueryDto,
    publicOnly = true,
  ): Promise<PaginatedProductsResponseDto> {
    this.ensurePriceRange(query);
    const { products, totalItems } = await this.productsRepository.findAll({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      search: query.search,
      categoryId: query.categoryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      status: query.status,
      sort: query.sort,
      publicOnly,
    });
    return {
      items: products.map((product) => this.toResponse(product)),
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
      },
    };
  }

  async findOne(id: string, publicOnly = true): Promise<ProductResponseDto> {
    const product = await this.productsRepository.findById(id, publicOnly);
    if (!product) throw new NotFoundException('Product not found');
    return this.toResponse(product);
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    image?: ProductImageUploadFile,
  ): Promise<ProductResponseDto> {
    const existing = await this.findOne(id, false);
    if (dto.categoryId) await this.ensureCategoryExists(dto.categoryId);
    let storedImage: StoredProductImage | undefined;
    try {
      storedImage = image
        ? await this.productImageUploadService.store(image)
        : undefined;
      const product = await this.productsRepository.update(id, {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.basePrice !== undefined ? { basePrice: dto.basePrice } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.stockQuantity !== undefined
          ? { stockQuantity: dto.stockQuantity }
          : {}),
        ...(dto.categoryId !== undefined
          ? { category: { connect: { id: dto.categoryId } } }
          : {}),
        ...(storedImage
          ? {
              images: {
                updateMany: {
                  where: { isPrimary: true },
                  data: { isPrimary: false },
                },
                create: {
                  url: storedImage.url,
                  altText: dto.name ?? existing.name,
                  isPrimary: true,
                  sortOrder: 0,
                },
              },
            }
          : {}),
      });
      return this.toResponse(product);
    } catch (error: unknown) {
      if (storedImage)
        await this.productImageUploadService.remove(storedImage.filePath);
      this.throwIfDuplicateSlug(error);
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    let result: Awaited<ReturnType<ProductsRepository['permanentlyDelete']>>;
    try {
      result = await this.productsRepository.permanentlyDelete(id);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Products with order history cannot be permanently deleted',
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Product not found');
      }
      throw error;
    }
    if (result.outcome === 'NOT_FOUND') {
      throw new NotFoundException('Product not found');
    }
    if (result.outcome === 'HAS_ORDER_HISTORY') {
      throw new ConflictException(
        'Products with order history cannot be permanently deleted',
      );
    }

    await Promise.all(
      result.imageUrls.map(async (url) => {
        try {
          await this.productImageUploadService.removeLocalProductImage(url);
        } catch {
          this.logger.warn(`Could not remove product image file: ${url}`);
        }
      }),
    );
    return { message: 'Product permanently deleted' };
  }

  async createImage(id: string, dto: ProductImageDto): Promise<ProductImage> {
    await this.findOne(id, false);
    return this.productsRepository.createImage(id, {
      url: dto.url,
      altText: dto.altText,
      isPrimary: dto.isPrimary ?? false,
      sortOrder: dto.sortOrder ?? 0,
    });
  }

  async updateImage(
    id: string,
    imageId: string,
    dto: UpdateProductImageDto,
  ): Promise<ProductImage> {
    await this.findOne(id, false);
    const image = await this.productsRepository.updateImage(id, imageId, {
      ...(dto.url !== undefined ? { url: dto.url } : {}),
      ...(dto.altText !== undefined ? { altText: dto.altText } : {}),
      ...(dto.isPrimary !== undefined ? { isPrimary: dto.isPrimary } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
    });
    if (!image) throw new NotFoundException('Product image not found');
    return image;
  }

  async removeImage(id: string, imageId: string): Promise<{ message: string }> {
    await this.findOne(id, false);
    const count = await this.productsRepository.deleteImage(id, imageId);
    if (count !== 1) throw new NotFoundException('Product image not found');
    return { message: 'Product image successfully deleted' };
  }

  async createOption(
    id: string,
    dto: ProductOptionDto,
  ): Promise<ProductOption> {
    await this.findOne(id, false);
    return this.productsRepository.createOption(id, {
      name: dto.name,
      values: dto.values,
      isRequired: dto.isRequired ?? false,
    });
  }

  async updateOption(
    id: string,
    optionId: string,
    dto: UpdateProductOptionDto,
  ): Promise<ProductOption> {
    await this.findOne(id, false);
    const option = await this.productsRepository.updateOption(id, optionId, {
      name: dto.name,
      values: dto.values,
      ...(dto.isRequired !== undefined ? { isRequired: dto.isRequired } : {}),
    });
    if (!option) throw new NotFoundException('Product option not found');
    return option;
  }

  async removeOption(
    id: string,
    optionId: string,
  ): Promise<{ message: string }> {
    await this.findOne(id, false);
    const count = await this.productsRepository.deleteOption(id, optionId);
    if (count !== 1) throw new NotFoundException('Product option not found');
    return { message: 'Product option successfully deleted' };
  }

  private async ensureCategoryExists(categoryId: number): Promise<void> {
    const exists = await this.productsRepository.categoryExists(categoryId);
    if (!exists) throw new NotFoundException('Category not found');
  }

  private ensureSinglePrimaryImage(
    images: ProductImageDto[] | undefined,
  ): void {
    if ((images?.filter((image) => image.isPrimary).length ?? 0) > 1)
      throw new BadRequestException(
        'Only one primary product image is allowed',
      );
  }

  private ensurePriceRange(query: FindProductsQueryDto): void {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      new Prisma.Decimal(query.minPrice).greaterThan(query.maxPrice)
    )
      throw new BadRequestException('minPrice must not exceed maxPrice');
  }

  private throwIfDuplicateSlug(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictException('Product slug already exists');
  }

  private toResponse(product: ProductDetails): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: product.basePrice.toFixed(2),
      status: product.status,
      stockQuantity: product.stockQuantity,
      soldQuantity: product.soldQuantity,
      category: product.category,
      images: product.images.map((image) => ({
        id: image.id,
        url: image.url,
        altText: image.altText,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder,
      })),
      options: product.options.map((option) => ({
        id: option.id,
        name: option.name,
        values: this.toStringValues(option.values),
        isRequired: option.isRequired,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private toStringValues(values: Prisma.JsonValue): string[] {
    return Array.isArray(values)
      ? values.filter((value): value is string => typeof value === 'string')
      : [];
  }
}
