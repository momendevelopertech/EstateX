import {
  Controller,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  Post,
  UseGuards,
  HttpCode,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthedRequestUser } from "../auth/roles.guard";

@Controller()
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("users/me")
  @UseGuards(AuthGuard("jwt"))
  async me(@CurrentUser() user: AuthedRequestUser) {
    const full = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true, agents: { include: { developer: true } } },
    });
    if (!full) throw new NotFoundException();
    // Strip the hash before serializing (never leak credentials).
    const userOut = full as any & { passwordHash?: string };
    delete userOut.passwordHash;
    return { user: userOut };
  }

  @Patch("users/me")
  @UseGuards(AuthGuard("jwt"))
  async updateMe(@Body() body: any, @CurrentUser() user: AuthedRequestUser) {
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.locale !== undefined) data.locale = body.locale;
    const updated = await this.prisma.user.update({ where: { id: user.id }, data });
    const updOut = updated as any & { passwordHash?: string };
    delete updOut.passwordHash;
    return { user: updOut };
  }

  @Get("users")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin")
  async list(@Param("_") _: never) {
    const users = await this.prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      users: (users as any[]).map((u) => {
        const out = u as any & { passwordHash?: string };
        delete out.passwordHash;
        return out;
      }),
    };
  }

  @Patch("users/:id/role")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin")
  async setRole(@Param("id") id: string, @Body() body: any) {
    if (!body.roleId) throw new NotFoundException("roleId required");
    const updated = await this.prisma.user.update({ where: { id }, data: { roleId: body.roleId } });
    const setOut = updated as any & { passwordHash?: string };
    delete setOut.passwordHash;
    return { ok: true, user: setOut };
  }

  @Post("users")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin")
  @HttpCode(201)
  async create(@Body() body: any, @CurrentUser() admin: AuthedRequestUser) {
    const { name, email, phone, password, roleId, locale } = body;
    if (!email || !password)
      throw new UnprocessableEntityException("email and password are required");
    const exists = await this.prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
    });
    if (exists) throw new ConflictException("User with this email already exists");
    const passwordHash = await bcrypt.hash(password, 10);
    const created = await this.prisma.user.create({
      data: {
        email: String(email).toLowerCase(),
        name: name ?? null,
        phone: phone ?? null,
        passwordHash,
        roleId: roleId ?? null,
        locale: locale ?? "en",
      },
    });
    await this.prisma.auditLog.create({
      data: { userId: admin.id, action: "create", entity: "User", entityId: created.id },
    });
    const out = created as any & { passwordHash?: string };
    delete out.passwordHash;
    return { ok: true, user: out };
  }

  @Delete("users/:id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin")
  async remove(@Param("id") id: string, @CurrentUser() admin: AuthedRequestUser) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    if (user.id === admin.id)
      throw new UnprocessableEntityException("You cannot delete your own account");
    await this.prisma.user.delete({ where: { id } });
    await this.prisma.auditLog.create({
      data: { userId: admin.id, action: "delete", entity: "User", entityId: id },
    });
    return { ok: true };
  }

  // --- Roles CRUD (spec §Roles) ---
  @Get("roles")
  @UseGuards(AuthGuard("jwt"))
  async listRoles() {
    const roles = await this.prisma.role.findMany({
      include: { _count: { select: { users: true } } },
    });
    return { roles };
  }

  @Post("roles")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin")
  @HttpCode(201)
  async createRole(@Body() body: any) {
    const { name, permissions } = body;
    if (!name) throw new UnprocessableEntityException("name is required");
    const exists = await this.prisma.role.findUnique({ where: { name } });
    if (exists) throw new ConflictException("Role already exists");
    const role = await this.prisma.role.create({
      data: { name, permissions: permissions ?? [] },
    });
    return { ok: true, role };
  }

  @Patch("roles/:id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin")
  async updateRole(@Param("id") id: string, @Body() body: any) {
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.permissions !== undefined) data.permissions = body.permissions;
    const role = await this.prisma.role.update({ where: { id }, data });
    return { ok: true, role };
  }

  @Delete("roles/:id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin")
  async deleteRole(@Param("id") id: string) {
    await this.prisma.role.delete({ where: { id } });
    return { ok: true };
  }
}
