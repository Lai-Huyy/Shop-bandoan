import { Injectable } from '@nestjs/common';
import { Prisma, Restaurant } from '../../../generated/prisma';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface FindRestaurantsOptions {
  skip: number;
  take: number;
  search?: string;
}

export interface RestaurantListResult {
  restaurants: Restaurant[];
  totalItems: number;
}

@Injectable()
export class RestaurantRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RestaurantCreateInput): Promise<Restaurant> {
    return this.prisma.restaurant.create({ data });
  }

  async findAll({
    skip,
    take,
    search,
  }: FindRestaurantsOptions): Promise<RestaurantListResult> {
    const where = this.getActiveRestaurantWhere(search);
    const [restaurants, totalItems] = await this.prisma.$transaction([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return { restaurants, totalItems };
  }

  findById(id: string): Promise<Restaurant | null> {
    return this.prisma.restaurant.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(
    id: string,
    data: Prisma.RestaurantUpdateInput,
  ): Promise<Restaurant | null> {
    const updated = await this.prisma.restaurant.updateMany({
      where: { id, deletedAt: null },
      data,
    });

    return updated.count === 1
      ? this.prisma.restaurant.findUnique({ where: { id } })
      : null;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.prisma.restaurant.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return result.count === 1;
  }

  private getActiveRestaurantWhere(
    search: string | undefined,
  ): Prisma.RestaurantWhereInput {
    if (!search) {
      return { deletedAt: null };
    }

    return {
      deletedAt: null,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ],
    };
  }
}
