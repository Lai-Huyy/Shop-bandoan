import { Injectable } from '@nestjs/common';
import { Prisma, UserAddress, UserStatus } from '../../../generated/prisma';
import { PrismaService } from '../../infrastructure/database/prisma.service';
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}
  findProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: { select: { name: true } },
      },
    });
  }
  findPassword(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { passwordHash: true },
    });
  }
  updateProfile(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: { select: { name: true } },
      },
    });
  }
  updatePassword(id: string, passwordHash: string) {
    return this.prisma.user
      .update({ where: { id }, data: { passwordHash } })
      .then(() => undefined);
  }
  listAddresses(userId: string): Promise<UserAddress[]> {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }
  async createAddress(
    userId: string,
    data: Omit<Prisma.UserAddressUncheckedCreateInput, 'userId'>,
  ): Promise<UserAddress> {
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault)
        await tx.userAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      return tx.userAddress.create({ data: { ...data, userId } });
    });
  }
  async updateAddress(
    userId: string,
    id: string,
    data: Prisma.UserAddressUpdateInput,
  ): Promise<UserAddress | null> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.userAddress.findFirst({
        where: { id, userId },
      });
      if (!existing) return null;
      if (data.isDefault === true)
        await tx.userAddress.updateMany({
          where: { userId, id: { not: id } },
          data: { isDefault: false },
        });
      return tx.userAddress.update({ where: { id }, data });
    });
  }
  deleteAddress(userId: string, id: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const address = await tx.userAddress.findFirst({ where: { id, userId } });
      if (!address) return 0;

      await tx.userAddress.delete({ where: { id } });
      if (!address.isDefault) return 1;

      const replacement = await tx.userAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (replacement) {
        await tx.userAddress.update({
          where: { id: replacement.id },
          data: { isDefault: true },
        });
      }
      return 1;
    });
  }
  async findAllForAdministration(
    skip: number,
    take: number,
    search?: string,
    role?: string,
    status?: UserStatus,
    createdAtOrder: 'asc' | 'desc' = 'desc',
  ) {
    const where: Prisma.UserWhereInput = {
      ...(role ? { role: { name: role } } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const select = {
      id: true,
      avatarUrl: true,
      username: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      role: { select: { name: true } },
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select,
        orderBy: { createdAt: createdAtOrder },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, totalItems };
  }
  findOneForAdministration(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        avatarUrl: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        role: { select: { name: true } },
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            label: true,
            recipientName: true,
            recipientPhone: true,
            streetAddress: true,
            ward: true,
            district: true,
            city: true,
            latitude: true,
            longitude: true,
            isDefault: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: { select: { orders: true } },
      },
    });
  }
  findRoleByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
      select: { id: true },
    });
  }
  findOtherUserByPhone(id: string, phone: string) {
    return this.prisma.user.findFirst({
      where: { id: { not: id }, phone },
      select: { id: true },
    });
  }
  updateForAdministration(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        avatarUrl: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        role: { select: { name: true } },
      },
    });
  }
}
