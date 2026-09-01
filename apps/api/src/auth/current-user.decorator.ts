import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthedRequestUser } from "../auth/roles.guard";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthedRequestUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
