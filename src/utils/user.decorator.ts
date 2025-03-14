import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user) {
      throw new UnauthorizedException('User not found in request. Ensure JWT is valid and your strategy is configured.');
    }
    return data ? request.user[data] : request.user;
  },
);
