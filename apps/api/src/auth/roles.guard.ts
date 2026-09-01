import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, PERMISSIONS_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles && !requiredPermissions) return true;

    const req = context.switchToHttp().getRequest();
    const auth: AuthedRequestUser = req.user;
    if (!auth) throw new UnauthorizedException();

    const hasRole = !requiredRoles || requiredRoles.some((r) => auth.roles.includes(r));
    const hasPermission =
      !requiredPermissions ||
      auth.permissions.includes("*") ||
      requiredPermissions.some((p) => auth.permissions.includes(p));

    if (!hasRole || !hasPermission) throw new ForbiddenException("Insufficient permissions");
    return true;
  }
}

export interface AuthedRequestUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}
