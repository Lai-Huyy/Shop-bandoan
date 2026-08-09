import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { RestaurantRepository } from './restaurants.repository';
import { RestaurantsService } from './restaurants.service';

describe('RestaurantsService', () => {
  const restaurant = {
    id: 'e7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
    name: 'Bandoan Kitchen',
    slug: 'bandoan-kitchen',
    description: 'Vietnamese comfort food',
    address: '123 Nguyen Hue',
    phone: null,
    imageUrl: null,
    isActive: true,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const repository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
  const service = new RestaurantsService(repository as RestaurantRepository);

  beforeEach(() => jest.clearAllMocks());

  it('returns paginated active restaurants', async () => {
    repository.findAll.mockResolvedValue({
      restaurants: [restaurant],
      totalItems: 1,
    });

    await expect(
      service.findAll({ page: 2, limit: 5, search: 'bandoan' }),
    ).resolves.toEqual({
      items: [restaurant],
      meta: { page: 2, limit: 5, totalItems: 1, totalPages: 1 },
    });
    expect(repository.findAll).toHaveBeenCalledWith({
      skip: 5,
      take: 5,
      search: 'bandoan',
    });
  });

  it('rejects duplicate restaurant slugs', async () => {
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate slug', {
        code: 'P2002',
        clientVersion: '6.16.2',
      }),
    );

    await expect(
      service.create({
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        address: restaurant.address,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not expose soft-deleted restaurants', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(restaurant.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('soft-deletes an active restaurant', async () => {
    repository.softDelete.mockResolvedValue(true);

    await expect(service.remove(restaurant.id)).resolves.toEqual({
      message: 'Restaurant successfully deleted',
    });
    expect(repository.softDelete).toHaveBeenCalledWith(restaurant.id);
  });
});
