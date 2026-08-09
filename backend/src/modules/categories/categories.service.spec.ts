import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  const category = {
    id: 1,
    name: 'Main dishes',
    slug: 'main-dishes',
    description: null,
    imageUrl: null,
    isDisplayed: true,
    sortOrder: 0,
    parentId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const repository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    hide: jest.fn(),
  };
  const service = new CategoriesService(repository as CategoriesRepository);

  beforeEach(() => jest.clearAllMocks());

  it('returns paginated visible categories', async () => {
    repository.findAll.mockResolvedValue({
      categories: [category],
      totalItems: 1,
    });

    await expect(
      service.findAll({ page: 2, limit: 5, search: 'main' }),
    ).resolves.toEqual({
      items: [category],
      meta: { page: 2, limit: 5, totalItems: 1, totalPages: 1 },
    });
    expect(repository.findAll).toHaveBeenCalledWith({
      skip: 5,
      take: 5,
      search: 'main',
      includeHidden: false,
    });
  });

  it('translates a duplicate slug to a conflict', async () => {
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate slug', {
        code: 'P2002',
        clientVersion: '6.16.2',
      }),
    );

    await expect(
      service.create({ name: category.name, slug: category.slug }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a missing parent category', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.create({
        name: category.name,
        slug: category.slug,
        parentId: 2,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a category as its own parent', async () => {
    repository.findById.mockResolvedValue(category);

    await expect(
      service.update(category.id, { parentId: category.id }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('hides an active category', async () => {
    repository.hide.mockResolvedValue(1);

    await expect(service.remove(category.id)).resolves.toEqual({
      message: 'Category successfully hidden',
    });
    expect(repository.hide).toHaveBeenCalledWith(category.id);
  });
});
