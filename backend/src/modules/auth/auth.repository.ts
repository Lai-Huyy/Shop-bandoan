import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  AuthUserWithPassword,
  AuthUserWithRole,
  SessionMetadata,
} from './auth.types';

interface CreateCustomerInput {
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
}

interface CreateSessionInput {
  id: string;
  userId: string;
  refreshTokenHash: string;
  metadata: SessionMetadata;
  expiresAt: Date;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByUsername(username: string): Promise<{ id: string } | null> {
    return this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
  }

  findUserByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  findUserByIdentifier(
    identifier: string,
  ): Promise<AuthUserWithPassword | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
      include: { role: true },
    });
  }

  findUserWithRoleById(id: string): Promise<AuthUserWithRole | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        status: true,
        role: { select: { name: true } },
      },
    });
  }

  async createCustomer(input: CreateCustomerInput): Promise<AuthUserWithRole> {
    return this.prisma.$transaction(async (transaction) => {
      const customerRole = await transaction.role.upsert({
        where: { name: 'CUSTOMER' },
        update: {},
        create: {
          name: 'CUSTOMER',
          description: 'Default customer account',
        },
      });
      const user = await transaction.user.create({
        data: {
          username: input.username,
          email: input.email,
          passwordHash: input.passwordHash,
          fullName: input.fullName,
          phone: input.phone,
          roleId: customerRole.id,
        },
        include: { role: true },
      });

      await transaction.cart.create({
        data: { userId: user.id },
      });

      return user;
    });
  }

  createSession(input: CreateSessionInput): Promise<void> {
    return this.prisma.userSession
      .create({
        data: {
          id: input.id,
          userId: input.userId,
          refreshTokenHash: input.refreshTokenHash,
          deviceIdentifier: input.metadata.userAgent,
          ipAddress: input.metadata.ipAddress,
          expiresAt: input.expiresAt,
        },
      })
      .then(() => undefined);
  }

  findSessionWithUser(id: string) {
    return this.prisma.userSession.findUnique({
      where: { id },
      include: {
        user: {
          include: { role: true },
        },
      },
    });
  }

  rotateSession(
    id: string,
    previousRefreshTokenHash: string,
    refreshTokenHash: string,
    expiresAt: Date,
    metadata: SessionMetadata,
  ): Promise<number> {
    return this.prisma.userSession
      .updateMany({
        where: {
          id,
          isRevoked: false,
          refreshTokenHash: previousRefreshTokenHash,
        },
        data: {
          refreshTokenHash,
          expiresAt,
          ipAddress: metadata.ipAddress,
          deviceIdentifier: metadata.userAgent,
        },
      })
      .then((result) => result.count);
  }

  revokeSession(sessionId: string, userId: string): Promise<void> {
    return this.prisma.userSession
      .updateMany({
        where: {
          id: sessionId,
          userId,
          isRevoked: false,
        },
        data: { isRevoked: true },
      })
      .then(() => undefined);
  }
}
