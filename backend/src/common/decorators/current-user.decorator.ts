import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestUser {
  [key: string]: unknown;
}

interface AuthenticatedRequest {
  user?: RequestUser;
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
