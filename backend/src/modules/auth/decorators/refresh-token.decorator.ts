import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { REFRESH_TOKEN_COOKIE_NAME } from '../auth.constants';

export const RefreshToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<Request>();
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) {
      return undefined;
    }

    const refreshTokenPair = cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${REFRESH_TOKEN_COOKIE_NAME}=`));

    if (!refreshTokenPair) {
      return undefined;
    }

    try {
      return decodeURIComponent(
        refreshTokenPair.slice(REFRESH_TOKEN_COOKIE_NAME.length + 1),
      );
    } catch {
      return undefined;
    }
  },
);
