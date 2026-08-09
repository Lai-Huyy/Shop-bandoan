import { Injectable } from '@nestjs/common';
import {
  Prisma,
  ProductStatus,
  type ProductImage,
  type ProductOption,
} from '../../../generated/prisma';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { ProductSortOption } from './dto/find-products-query.dto';

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
  options: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.ProductInclude;

export type ProductDetails = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

export interface FindProductsOptions {
  skip: number;
  take: number;
  search?: string;
  categoryId?: number;
  minPrice?: string;
  maxPrice?: string;
  status?: ProductStatus;
  sort?: ProductSortOption;
  publicOnly: boolean;
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ProductCreateInput): Promise<ProductDetails> {
    return this.prisma.product.create({ data, include: productInclude });
  }

  async findAll(
    options: FindProductsOptions,
  ): Promise<{ products: ProductDetails[]; totalItems: number }> {
    const where = this.getWhere(options);
    const [products, totalItems] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: options.skip,
        take: options.take,
        include: productInclude,
        orderBy: this.getOrderBy(options.sort),
      }),
      this.prisma.product.count({ where }),
    ]);
    return { products, totalItems };
  }

  findById(id: string, publicOnly: boolean): Promise<ProductDetails | null> {
    return this.prisma.product.findFirst({
      where: { id, ...(publicOnly ? { status: ProductStatus.AVAILABLE } : {}) },
      include: productInclude,
    });
  }

  update(id: string, data: Prisma.ProductUpdateInput): Promise<ProductDetails> {
    return this.prisma.product.update({
      where: { id },
      data,
      include: productInclude,
    });
  }

  async permanentlyDelete(
    id: string,
  ): Promise<
    | { outcome: 'NOT_FOUND' }
    | { outcome: 'HAS_ORDER_HISTORY' }
    | { outcome: 'DELETED'; imageUrls: string[] }
  > {
    return this.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({
        where: { id },
        select: { images: { select: { url: true } } },
      });
      if (!product) return { outcome: 'NOT_FOUND' };

      const orderItemCount = await transaction.orderItem.count({
        where: { productId: id },
      });
      if (orderItemCount > 0) return { outcome: 'HAS_ORDER_HISTORY' };

      await transaction.cartItem.deleteMany({ where: { productId: id } });
      await transaction.product.delete({ where: { id } });
      return {
        outcome: 'DELETED',
        imageUrls: product.images.map((image) => image.url),
      };
    });
  }

  categoryExists(id: number): Promise<boolean> {
    return this.prisma.category
      .findUnique({ where: { id }, select: { id: true } })
      .then((category) => Boolean(category));
  }

  createImage(
    productId: string,
    data: Omit<Prisma.ProductImageUncheckedCreateInput, 'productId'>,
  ): Promise<ProductImage> {
    return this.prisma.$transaction(async (transaction) => {
      if (data.isPrimary) {
        await transaction.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return transaction.productImage.create({ data: { ...data, productId } });
    });
  }

  updateImage(
    productId: string,
    imageId: string,
    data: Prisma.ProductImageUpdateInput,
  ): Promise<ProductImage | null> {
    return this.prisma.$transaction(async (transaction) => {
      const image = await transaction.productImage.findFirst({
        where: { id: imageId, productId },
      });
      if (!image) return null;
      if (data.isPrimary === true) {
        await transaction.productImage.updateMany({
          where: { productId, isPrimary: true, id: { not: imageId } },
          data: { isPrimary: false },
        });
      }
      return transaction.productImage.update({ where: { id: imageId }, data });
    });
  }

  deleteImage(productId: string, imageId: string): Promise<number> {
    return this.prisma.productImage
      .deleteMany({ where: { id: imageId, productId } })
      .then((result) => result.count);
  }

  createOption(
    productId: string,
    data: Omit<Prisma.ProductOptionUncheckedCreateInput, 'productId'>,
  ): Promise<ProductOption> {
    return this.prisma.productOption.create({ data: { ...data, productId } });
  }

  updateOption(
    productId: string,
    optionId: string,
    data: Prisma.ProductOptionUpdateInput,
  ): Promise<ProductOption | null> {
    return this.prisma.productOption
      .updateMany({ where: { id: optionId, productId }, data })
      .then(async (result) => {
        if (result.count !== 1) return null;
        return this.prisma.productOption.findUnique({
          where: { id: optionId },
        });
      });
  }

  deleteOption(productId: string, optionId: string): Promise<number> {
    return this.prisma.productOption
      .deleteMany({ where: { id: optionId, productId } })
      .then((result) => result.count);
  }

  private getWhere(options: FindProductsOptions): Prisma.ProductWhereInput {
    return {
      ...(options.publicOnly
        ? { status: ProductStatus.AVAILABLE }
        : options.status
          ? { status: options.status }
          : {}),
      ...(options.categoryId ? { categoryId: options.categoryId } : {}),
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: 'insensitive' } },
              { slug: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(options.minPrice || options.maxPrice
        ? {
            basePrice: {
              ...(options.minPrice ? { gte: options.minPrice } : {}),
              ...(options.maxPrice ? { lte: options.maxPrice } : {}),
            },
          }
        : {}),
    };
  }

  private getOrderBy(
    sort: ProductSortOption | undefined,
  ): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'price-asc':
        return [{ basePrice: 'asc' }, { id: 'asc' }];
      case 'price-desc':
        return [{ basePrice: 'desc' }, { id: 'asc' }];
      case 'popular':
        return [{ soldQuantity: 'desc' }, { id: 'asc' }];
      default:
        return [{ createdAt: 'desc' }, { id: 'asc' }];
    }
  }
}
