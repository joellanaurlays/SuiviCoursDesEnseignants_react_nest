import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthContext } from './auth-context.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.authContext as AuthContext | undefined;
  },
);