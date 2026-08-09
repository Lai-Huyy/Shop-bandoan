import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthenticatedUser } from '../auth/auth.types';
import {
  ChangePasswordDto,
  CreateAddressDto,
  UpdateAddressDto,
  UpdateProfileDto,
} from './dto/profile.dto';
import { UsersRepository } from './users.repository';
import { Prisma, UserStatus } from '../../../generated/prisma';
import {
  FindAdminUsersQueryDto,
  UpdateAdminUserDto,
} from './dto/admin-users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}
  getCurrentUser(user: AuthenticatedUser): AuthenticatedUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }

  async getProfile(userId: string) {
    const profile = await this.usersRepository.findProfile(userId);
    if (!profile) throw new NotFoundException('User not found');
    return { ...profile, role: profile.role.name };
  }
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.usersRepository.updateProfile(userId, dto);
    return { ...profile, role: profile.role.name };
  }
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    if (dto.currentPassword === dto.newPassword)
      throw new ConflictException(
        'New password must differ from current password',
      );
    const user = await this.usersRepository.findPassword(userId);
    if (
      !user ||
      !(await bcrypt.compare(dto.currentPassword, user.passwordHash))
    )
      throw new UnauthorizedException('Current password is incorrect');
    await this.usersRepository.updatePassword(
      userId,
      await bcrypt.hash(
        dto.newPassword,
        this.configService.getOrThrow<number>('auth.bcryptSaltRounds'),
      ),
    );
    return { message: 'Password successfully changed' };
  }
  listAddresses(userId: string) {
    return this.usersRepository.listAddresses(userId);
  }
  createAddress(userId: string, dto: CreateAddressDto) {
    return this.usersRepository.createAddress(userId, {
      ...dto,
      city: dto.provinceName,
      ward: dto.wardName,
      district: null,
    });
  }
  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.usersRepository.updateAddress(userId, id, {
      ...dto,
      ...(dto.provinceName ? { city: dto.provinceName } : {}),
      ...(dto.wardName ? { ward: dto.wardName } : {}),
      ...(dto.provinceName || dto.wardName ? { district: null } : {}),
    });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }
  async deleteAddress(
    userId: string,
    id: string,
  ): Promise<{ message: string }> {
    if ((await this.usersRepository.deleteAddress(userId, id)) !== 1)
      throw new NotFoundException('Address not found');
    return { message: 'Address successfully deleted' };
  }
  async findAllForAdministration(query: FindAdminUsersQueryDto) {
    const result = await this.usersRepository.findAllForAdministration(
      (query.page - 1) * query.limit,
      query.limit,
      query.search,
      query.role,
      query.status,
      query.createdAtOrder,
    );
    return {
      items: result.items.map((user) => ({ ...user, role: user.role.name })),
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / query.limit),
      },
    };
  }
  async findOneForAdministration(id: string) {
    const user = await this.usersRepository.findOneForAdministration(id);
    if (!user) throw new NotFoundException('User not found');

    const { _count, role, addresses, ...profile } = user;
    return {
      ...profile,
      role: role.name,
      addresses,
      orderCount: _count.orders,
    };
  }
  async updateForAdministration(id: string, dto: UpdateAdminUserDto) {
    await this.findOneForAdministration(id);
    if (
      dto.phone &&
      (await this.usersRepository.findOtherUserByPhone(id, dto.phone))
    )
      throw new ConflictException('Phone number is already in use');
    const role = dto.role
      ? await this.usersRepository.findRoleByName(dto.role)
      : undefined;
    if (dto.role && !role) throw new BadRequestException('Invalid role');
    try {
      const user = await this.usersRepository.updateForAdministration(id, {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(role ? { role: { connect: { id: role.id } } } : {}),
      });
      return { ...user, role: user.role.name };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Email is already in use');
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('User not found');
      throw error;
    }
  }
  updateStatusForAdministration(id: string, status: UserStatus) {
    return this.updateForAdministration(id, { status });
  }
}
