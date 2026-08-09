import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserStatus } from '../../../generated/prisma';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService administration operations', () => {
  const user = {
    id: 'b6f14cc0-6eb3-4904-a6a6-b89434b510cb',
    avatarUrl: null,
    username: 'customer',
    fullName: 'Customer Example',
    email: 'customer@example.com',
    phone: '0900000000',
    status: UserStatus.ACTIVE,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    role: { name: 'CUSTOMER' },
  };
  const repository = {
    findAllForAdministration: jest.fn(),
    findOneForAdministration: jest.fn(),
    findRoleByName: jest.fn(),
    findOtherUserByPhone: jest.fn(),
    updateForAdministration: jest.fn(),
  };
  const service = new UsersService(
    repository as unknown as UsersRepository,
    {} as ConfigService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns paginated users with search, role, and status filters', async () => {
    repository.findAllForAdministration.mockResolvedValue({
      items: [user],
      totalItems: 11,
    });

    await expect(
      service.findAllForAdministration({
        page: 2,
        limit: 5,
        search: 'customer',
        role: 'CUSTOMER',
        status: UserStatus.ACTIVE,
        createdAtOrder: 'desc',
      }),
    ).resolves.toEqual({
      items: [{ ...user, role: 'CUSTOMER' }],
      meta: { page: 2, limit: 5, totalItems: 11, totalPages: 3 },
    });
    expect(repository.findAllForAdministration).toHaveBeenCalledWith(
      5,
      5,
      'customer',
      'CUSTOMER',
      UserStatus.ACTIVE,
      'desc',
    );
  });

  it('returns user detail without internal relation keys', async () => {
    repository.findOneForAdministration.mockResolvedValue({
      ...user,
      addresses: [
        {
          id: 'address-id',
          recipientName: 'Customer Example',
          recipientPhone: '0900000000',
          streetAddress: '1 Example Street',
          city: 'Ho Chi Minh City',
          isDefault: true,
        },
      ],
      _count: { orders: 3 },
    });

    await expect(service.findOneForAdministration(user.id)).resolves.toEqual({
      ...user,
      role: 'CUSTOMER',
      addresses: [
        {
          id: 'address-id',
          recipientName: 'Customer Example',
          recipientPhone: '0900000000',
          streetAddress: '1 Example Street',
          city: 'Ho Chi Minh City',
          isDefault: true,
        },
      ],
      orderCount: 3,
    });
  });

  it('rejects a missing user detail', async () => {
    repository.findOneForAdministration.mockResolvedValue(null);

    await expect(service.findOneForAdministration(user.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates supported fields and connects an existing role', async () => {
    repository.findOneForAdministration.mockResolvedValue({
      ...user,
      addresses: [],
      _count: { orders: 0 },
    });
    repository.findRoleByName.mockResolvedValue({ id: 1 });
    repository.updateForAdministration.mockResolvedValue({
      ...user,
      fullName: 'Updated Customer',
      status: UserStatus.SUSPENDED,
      role: { name: 'ADMIN' },
    });

    await expect(
      service.updateForAdministration(user.id, {
        fullName: 'Updated Customer',
        role: 'ADMIN',
        status: UserStatus.SUSPENDED,
      }),
    ).resolves.toEqual({
      ...user,
      fullName: 'Updated Customer',
      status: UserStatus.SUSPENDED,
      role: 'ADMIN',
    });
    expect(repository.updateForAdministration).toHaveBeenCalledWith(user.id, {
      fullName: 'Updated Customer',
      status: UserStatus.SUSPENDED,
      role: { connect: { id: 1 } },
    });
  });

  it('rejects an invalid role', async () => {
    repository.findOneForAdministration.mockResolvedValue({
      ...user,
      addresses: [],
      _count: { orders: 0 },
    });
    repository.findRoleByName.mockResolvedValue(null);

    await expect(
      service.updateForAdministration(user.id, { role: 'UNKNOWN' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('maps duplicate email failures to a conflict response', async () => {
    repository.findOneForAdministration.mockResolvedValue({
      ...user,
      addresses: [],
      _count: { orders: 0 },
    });
    repository.updateForAdministration.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.updateForAdministration(user.id, { email: 'used@example.com' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects a phone number already assigned to another user', async () => {
    repository.findOneForAdministration.mockResolvedValue({
      ...user,
      addresses: [],
      _count: { orders: 0 },
    });
    repository.findOtherUserByPhone.mockResolvedValue({ id: 'other-user-id' });

    await expect(
      service.updateForAdministration(user.id, { phone: '0912345678' }),
    ).rejects.toThrow(ConflictException);
    expect(repository.updateForAdministration).not.toHaveBeenCalled();
  });

  it('changes account status through the same update policy', async () => {
    repository.findOneForAdministration.mockResolvedValue({
      ...user,
      addresses: [],
      _count: { orders: 0 },
    });
    repository.updateForAdministration.mockResolvedValue({
      ...user,
      status: UserStatus.BANNED,
    });

    await expect(
      service.updateStatusForAdministration(user.id, UserStatus.BANNED),
    ).resolves.toEqual({
      ...user,
      status: UserStatus.BANNED,
      role: 'CUSTOMER',
    });
    expect(repository.updateForAdministration).toHaveBeenCalledWith(user.id, {
      status: UserStatus.BANNED,
    });
  });
});
