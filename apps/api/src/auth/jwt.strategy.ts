import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService, AuthedUser } from "./auth.service";

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly auth: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "estatex-demo-secret",
    });
  }

  async validate(payload: JwtPayload): Promise<AuthedUser> {
    const user = await this.auth.findByEmail(payload.email);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
