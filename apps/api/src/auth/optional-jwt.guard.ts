import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * JWT guard that tolerates an absent/invalid token: the request proceeds as
 * anonymous (req.user = null) instead of raising 401. Used by endpoints that are
 * valid for both guests (guestSessionId) and authenticated users (FR-18 favorites,
 * comparisons, analytics tracking).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(err: any, user: any, _info: any, _context: any, _status?: any) {
    if (err || !user) return null;
    return user;
  }
}
