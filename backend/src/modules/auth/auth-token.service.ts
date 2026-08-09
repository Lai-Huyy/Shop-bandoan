import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import {
  AccessTokenPayload,
  AuthTokens,
  AuthUserWithRole,
  RefreshTokenClaims,
  RefreshTokenPayload,
} from './auth.types';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createTokens(
    user: AuthUserWithRole,
    sessionId: string,
  ): Promise<AuthTokens> {
    const accessTokenPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      type: 'access',
    };
    const refreshTokenPayload: RefreshTokenPayload = {
      sub: user.id,
      sid: sessionId,
      type: 'refresh',
    };
    const accessToken = await this.jwtService.signAsync(accessTokenPayload);
    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.configService.getOrThrow<string>(
        'jwt.refreshExpiresIn',
      ) as SignOptions['expiresIn'],
    });

    return {
      accessToken,
      accessTokenExpiresIn: this.getTokenExpiresIn(accessToken, 'Access'),
      refreshToken,
      refreshTokenExpiresAt: this.getTokenExpiry(refreshToken, 'Refresh'),
    };
  }

  verifyRefreshToken(refreshToken: string): RefreshTokenClaims {
    try {
      const payload = this.jwtService.verify<RefreshTokenClaims>(refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });
      if (payload.type !== 'refresh' || !payload.sub || !payload.sid) {
        throw new UnauthorizedException('Refresh token is invalid or expired');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
  }

  private getTokenExpiresIn(token: string, tokenName: string): number {
    const expiresAt = this.getTokenExpiry(token, tokenName);
    return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  }

  private getTokenExpiry(token: string, tokenName: string): Date {
    const payload: unknown = this.jwtService.decode(token);
    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof (payload as { exp?: unknown }).exp !== 'number'
    ) {
      throw new InternalServerErrorException(
        `${tokenName} token expiration could not be determined`,
      );
    }

    return new Date((payload as { exp: number }).exp * 1000);
  }
}
