import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_PATH,
} from './auth.constants';
import { AuthTokens } from './auth.types';

@Injectable()
export class AuthCookieService {
  constructor(private readonly configService: ConfigService) {}

  setRefreshToken(response: Response, authentication: AuthTokens): void {
    response.cookie(REFRESH_TOKEN_COOKIE_NAME, authentication.refreshToken, {
      ...this.getRefreshTokenCookieOptions(),
      expires: authentication.refreshTokenExpiresAt,
    });
  }

  clearRefreshToken(response: Response): void {
    response.clearCookie(
      REFRESH_TOKEN_COOKIE_NAME,
      this.getRefreshTokenCookieOptions(),
    );
  }

  private getRefreshTokenCookieOptions() {
    return {
      httpOnly: true,
      path: REFRESH_TOKEN_COOKIE_PATH,
      sameSite: 'lax' as const,
      secure:
        this.configService.getOrThrow<string>('app.environment') ===
        'production',
    };
  }
}
