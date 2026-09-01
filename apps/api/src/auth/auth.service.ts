import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

export interface AuthedUser {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (!user || !user.passwordHash) return null;
    if (!(await bcrypt.compare(password, user.passwordHash))) return null;
    return this.toAuthedUser(user);
  }

  toAuthedUser(user: {
    id: string;
    email: string;
    name?: string | null;
    role?: { name: string; permissions: any } | null;
  }): AuthedUser {
    const perms: string[] =
      Array.isArray(user.role?.permissions) && user.role!.permissions.includes("*")
        ? ["*"]
        : ((user.role?.permissions as string[]) ?? []);
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      roles: user.role ? [user.role.name] : [],
      permissions: perms,
    };
  }

  async login(email: string, password: string) {
    const authed = await this.validateUser(email, password);
    if (!authed) throw new UnauthorizedException("Invalid credentials");
    const payload = { sub: authed.id, email: authed.email, roles: authed.roles };
    return {
      accessToken: await this.jwt.signAsync(payload, { expiresIn: "7d" }),
      user: authed,
    };
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { role: true } });
    return user ? this.toAuthedUser(user) : null;
  }
}
