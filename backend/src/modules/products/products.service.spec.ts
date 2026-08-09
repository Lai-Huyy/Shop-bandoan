import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '../../../generated/prisma';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const product = {
    id: 'e7e277bd-0e42-4544-a4f8-20e37b1d1b1b',
    name: 'Spicy beef noodle',
    slug: 'spicy-beef-noodle',
    description: null,
    basePrice: new Prisma.Decimal('79000.00'),
    status: ProductStatus.AVAILABLE,
    stockQuantity: 12,
    soldQuantity: 3,
    categoryId: 1,
    category: { id: 1, name: 'Noodles', slug: 'noodles' },
    images: [],
    options: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const repository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    permanentlyDelete: jest.fn(),
    categoryExists: jest.fn(),
    createImage: jest.fn(),
    updateImage: jest.fn(),
    deleteImage: jest.fn(),
    createOption: jest.fn(),
    updateOption: jest.fn(),
    deleteOption: jest.fn(),
  };
  const productImageUploadService = {
    store: jest.fn(),
    remove: jest.fn(),
    removeLocalProductImage: jest.fn(),
  };
  const service = new ProductsService(
    repository as ProductsRepository,
    productImageUploadService as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('lists only available products for public discovery', async () => {
    repository.findAll.mockResolvedValue({
      products: [product],
      totalItems: 1,
    });

    await expect(
      service.findAll({ page: 2, limit: 5, search: 'noodle' }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: product.id,
          basePrice: '79000.00',
          status: ProductStatus.AVAILABLE,
          stockQuantity: 12,
          soldQuantity: 3,
        }),
      ],
      meta: { page: 2, limit: 5, totalItems: 1, totalPages: 1 },
    });
    expect(repository.findAll).toHaveBeenCalledWith({
      skip: 5,
      take: 5,
      search: 'noodle',
      categoryId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      status: undefined,
      sort: undefined,
      publicOnly: true,
    });
  });

  it('rejects invalid price ranges before querying', async () => {
    await expect(
      service.findAll({
        page: 1,
        limit: 20,
        minPrice: '100.00',
        maxPrice: '99.00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findAll).not.toHaveBeenCalled();
  });

  it('forwards the requested database sort with the category filter', async () => {
    repository.findAll.mockResolvedValue({ products: [], totalItems: 0 });

    await service.findAll({
      page: 1,
      limit: 20,
      categoryId: product.categoryId,
      sort: 'price-asc',
    });

    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: product.categoryId,
        sort: 'price-asc',
        publicOnly: true,
      }),
    );
  });

  it('translates duplicate product slugs to a conflict', async () => {
    repository.categoryExists.mockResolvedValue(true);
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate slug', {
        code: 'P2002',
        clientVersion: '6.16.2',
      }),
    );

    await expect(
      service.create({
        name: product.name,
        slug: product.slug,
        basePrice: '79000.00',
        categoryId: product.categoryId,
        stockQuantity: 12,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a missing category during product creation', async () => {
    repository.categoryExists.mockResolvedValue(false);

    await expect(
      service.create({
        name: product.name,
        slug: product.slug,
        basePrice: '79000.00',
        categoryId: product.categoryId,
        stockQuantity: 12,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects multiple primary images on product creation', async () => {
    repository.categoryExists.mockResolvedValue(true);

    await expect(
      service.create({
        name: product.name,
        slug: product.slug,
        basePrice: '79000.00',
        categoryId: product.categoryId,
        stockQuantity: 12,
        images: [
          { url: 'https://cdn.example.test/one.jpg', isPrimary: true },
          { url: 'https://cdn.example.test/two.jpg', isPrimary: true },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates the product with a validated local image', async () => {
    repository.categoryExists.mockResolvedValue(true);
    productImageUploadService.store.mockResolvedValue({
      filePath: 'uploads/products/noodle.png',
      url: 'http://localhost:3000/uploads/products/noodle.png',
    });
    repository.create.mockResolvedValue({
      ...product,
      images: [
        {
          id: 'c04e0d42-3aae-4498-a5ce-4f1ab86e97c8',
          url: 'http://localhost:3000/uploads/products/noodle.png',
          altText: product.name,
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    });

    await expect(
      service.create(
        {
          name: product.name,
          slug: product.slug,
          basePrice: '79000.00',
          categoryId: product.categoryId,
          stockQuantity: 12,
        },
        {
          buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
          mimetype: 'image/png',
          size: 4,
        },
      ),
    ).resolves.toMatchObject({ images: [{ isPrimary: true }] });

    expect(productImageUploadService.store).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        images: {
          create: [
            expect.objectContaining({
              isPrimary: true,
              url: 'http://localhost:3000/uploads/products/noodle.png',
            }),
          ],
        },
      }),
    );
  });

  it('permanently removes a product without order history', async () => {
    repository.permanentlyDelete.mockResolvedValue({
      outcome: 'DELETED',
      imageUrls: [],
    });

    await expect(service.remove(product.id)).resolves.toEqual({
      message: 'Product permanently deleted',
    });
    expect(repository.permanentlyDelete).toHaveBeenCalledWith(product.id);
  });

  it('prevents permanent deletion of a product with order history', async () => {
    repository.permanentlyDelete.mockResolvedValue({
      outcome: 'HAS_ORDER_HISTORY',
    });

    await expect(service.remove(product.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('translates a concurrent order relation into a deletion conflict', async () => {
    repository.permanentlyDelete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Foreign key constraint', {
        code: 'P2003',
        clientVersion: '6.16.2',
      }),
    );

    await expect(service.remove(product.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('stores an uploaded replacement image as the product primary image', async () => {
    repository.findById.mockResolvedValue(product);
    productImageUploadService.store.mockResolvedValue({
      filePath: 'uploads/products/replacement.png',
      url: 'http://localhost:3000/uploads/products/replacement.png',
    });
    repository.update.mockResolvedValue({
      ...product,
      images: [
        {
          id: 'd04e0d42-3aae-4498-a5ce-4f1ab86e97c8',
          url: 'http://localhost:3000/uploads/products/replacement.png',
          altText: product.name,
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    });

    await expect(
      service.update(
        product.id,
        { name: product.name },
        {
          buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
          mimetype: 'image/png',
          size: 4,
        },
      ),
    ).resolves.toMatchObject({
      images: [
        expect.objectContaining({
          url: 'http://localhost:3000/uploads/products/replacement.png',
          isPrimary: true,
        }),
      ],
    });

    const updateCalls = repository.update.mock.calls as unknown as [
      string,
      {
        images: {
          create: { url: string; isPrimary: boolean };
        };
      },
    ][];
    expect(updateCalls[0][0]).toBe(product.id);
    expect(updateCalls[0][1].images.create).toEqual({
      url: 'http://localhost:3000/uploads/products/replacement.png',
      altText: product.name,
      isPrimary: true,
      sortOrder: 0,
    });
  });
});
