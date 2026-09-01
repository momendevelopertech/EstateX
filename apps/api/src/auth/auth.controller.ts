import { Controller, Post, Body, Req, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("login")
  async login(@Body() body: { email?: string; password?: string }) {
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    if (!email || !password) {
      throw new UnauthorizedException("Email and password are required");
    }
    return this.auth.login(email, password);
  }

  @Post("refresh")
  async refresh(@Req() req: Request) {
    const header = (req.headers as any)["authorization"] as string | undefined;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedException();
    const token = header.slice(7);
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      // Expired/invalid token: a real deployment would rotate from an HttpOnly refresh
      // cookie here; Phase 1 re-issues only when the access token is still valid.
      throw new UnauthorizedException("Invalid or expired token");
    }
    if (!payload?.sub) throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user) throw new UnauthorizedException();
    const authed = this.auth.toAuthedUser(user);
    const accessToken = await this.jwt.signAsync(
      { sub: authed.id, email: authed.email, roles: authed.roles },
      { expiresIn: "7d" },
    );
    return { accessToken, user: authed };
  }

  @Post("logout")
  async logout() {
    return { ok: true };
  }
}
