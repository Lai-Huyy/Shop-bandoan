import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../../generated/prisma';
import { AuthRepository } from './auth.repository';
import {
  AuthenticatedUser,
  AuthenticationResult,
  AuthUserWithRole,
  SessionMetadata,
} from './auth.types';
import { AuthTokenService } from './auth-token.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authTokenService: AuthTokenService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
    metadata: SessionMetadata,
  ): Promise<AuthenticationResult> {
    const [existingUsername, existingEmail] = await Promise.all([
      this.authRepository.findUserByUsername(dto.username),
      this.authRepository.findUserByEmail(dto.email),
    ]);
    if (existingUsername) {
      throw new ConflictException('Username is already registered');
    }
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.getSaltRounds());
    let user: AuthUserWithRole;
    try {
      user = await this.authRepository.createCustomer({
        username: dto.username,
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
      });
    } catch (error: unknown) {
      this.throwIfUniqueConstraint(error);
      throw error;
    }

    return this.createAuthenticationResult(user, metadata);
  }

  async login(
    dto: LoginDto,
    metadata: SessionMetadata,
  ): Promise<AuthenticationResult> {
    const user = await this.authRepository.findUserByIdentifier(
      this.getLoginIdentifier(dto),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.ensureActiveUser(user);

    return this.createAuthenticationResult(user, metadata);
  }

  async refresh(
    refreshToken: string | undefined,
    metadata: SessionMetadata,
  ): Promise<AuthenticationResult> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const payload = this.authTokenService.verifyRefreshToken(refreshToken);
    const session = await this.authRepository.findSessionWithUser(payload.sid);

    if (
      !session ||
      session.userId !== payload.sub ||
      session.isRevoked ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const isTokenValid = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );
    if (!isTokenValid) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    this.ensureActiveUser(session.user);

    const tokens = await this.authTokenService.createTokens(
      session.user,
      session.id,
    );
    const refreshTokenHash = await bcrypt.hash(
      tokens.refreshToken,
      this.getSaltRounds(),
    );
    const updatedSessionCount = await this.authRepository.rotateSession(
      session.id,
      session.refreshTokenHash,
      refreshTokenHash,
      tokens.refreshTokenExpiresAt,
      metadata,
    );

    if (updatedSessionCount !== 1) {
      throw new UnauthorizedException('Refresh token has already been rotated');
    }

    return {
      ...tokens,
      user: this.toAuthenticatedUser(session.user),
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = this.authTokenService.verifyRefreshToken(refreshToken);
      await this.authRepository.revokeSession(payload.sid, payload.sub);
    } catch {
      // Logout is idempotent and must clear the client cookie even for stale tokens.
    }
  }

  private async createAuthenticationResult(
    user: AuthUserWithRole,
    metadata: SessionMetadata,
  ): Promise<AuthenticationResult> {
    const sessionId = randomUUID();
    const tokens = await this.authTokenService.createTokens(user, sessionId);
    const refreshTokenHash = await bcrypt.hash(
      tokens.refreshToken,
      this.getSaltRounds(),
    );

    await this.authRepository.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      metadata,
      expiresAt: tokens.refreshTokenExpiresAt,
    });

    return {
      ...tokens,
      user: this.toAuthenticatedUser(user),
    };
  }

  private ensureActiveUser(user: AuthUserWithRole): void {
    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('Account is suspended or banned');
    }
  }

  private getSaltRounds(): number {
    return this.configService.getOrThrow<number>('auth.bcryptSaltRounds');
  }

  private getLoginIdentifier(dto: LoginDto): string {
    if (dto.identifier && dto.email) {
      throw new BadRequestException(
        'Provide either username or email, not both',
      );
    }

    const identifier = dto.identifier ?? dto.email;
    if (!identifier) {
      throw new BadRequestException('Username or email is required');
    }

    return identifier;
  }

  private throwIfUniqueConstraint(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Username or email is already registered');
    }
  }

  private toAuthenticatedUser(user: AuthUserWithRole): AuthenticatedUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
    };
  }
}
