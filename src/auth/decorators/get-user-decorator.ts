// src/auth/decorators/get-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Assumes that JwtStrategy's validate method returns the user object
  },
);
