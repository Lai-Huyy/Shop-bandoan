import { Injectable } from '@nestjs/common';
import { Category, Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface FindCategoriesOptions {
  skip: number;
  take: number;
  search?: string;
  includeHidden: boolean;
}

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CategoryUncheckedCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  async findAll(
    options: FindCategoriesOptions,
  ): Promise<{ categories: Category[]; totalItems: number }> {
    const where = this.getWhere(options.search, options.includeHidden);
    const [categories, totalItems] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.category.count({ where }),
    ]);
    return { categories, totalItems };
  }

  findById(id: number, includeHidden: boolean): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: { id, ...(includeHidden ? {} : { isDisplayed: true }) },
    });
  }

  update(
    id: number,
    data: Prisma.CategoryUncheckedUpdateInput,
  ): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  hide(id: number): Promise<number> {
    return this.prisma.category
      .updateMany({
        where: { id, isDisplayed: true },
        data: { isDisplayed: false },
      })
      .then((result) => result.count);
  }

  private getWhere(
    search: string | undefined,
    includeHidden: boolean,
  ): Prisma.CategoryWhereInput {
    return {
      ...(includeHidden ? {} : { isDisplayed: true }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }
}
