import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from '../types/req-user.interface';

export const User = createParamDecorator(
  (field: keyof CurrentUser | undefined, ctx: ExecutionContext): CurrentUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUser;

    if (!user){
      throw new UnauthorizedException();
    }
    return field ? user[field] : user;
  },
);
