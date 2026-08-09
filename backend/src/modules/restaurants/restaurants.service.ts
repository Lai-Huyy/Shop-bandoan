import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Restaurant } from '../../../generated/prisma';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { FindRestaurantsQueryDto } from './dto/find-restaurants-query.dto';
import { PaginatedRestaurantsResponseDto } from './dto/restaurant-response.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantRepository } from './restaurants.repository';

@Injectable()
export class RestaurantsService {
  constructor(private readonly restaurantRepository: RestaurantRepository) {}

  async create(dto: CreateRestaurantDto): Promise<Restaurant> {
    try {
      return await this.restaurantRepository.create({
        ...dto,
        isActive: dto.isActive ?? true,
      });
    } catch (error) {
      this.throwIfDuplicateSlug(error);
      throw error;
    }
  }

  async findAll(
    query: FindRestaurantsQueryDto,
  ): Promise<PaginatedRestaurantsResponseDto> {
    const { page, limit, search } = query;
    const { restaurants, totalItems } = await this.restaurantRepository.findAll(
      {
        skip: (page - 1) * limit,
        take: limit,
        search,
      },
    );

    return {
      items: restaurants,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findById(id);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async update(id: string, dto: UpdateRestaurantDto): Promise<Restaurant> {
    try {
      const restaurant = await this.restaurantRepository.update(id, dto);
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      return restaurant;
    } catch (error) {
      this.throwIfDuplicateSlug(error);
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const wasDeleted = await this.restaurantRepository.softDelete(id);
    if (!wasDeleted) {
      throw new NotFoundException('Restaurant not found');
    }

    return { message: 'Restaurant successfully deleted' };
  }

  private throwIfDuplicateSlug(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Restaurant slug already exists');
    }
  }
}
