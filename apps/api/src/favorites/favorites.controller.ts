import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  UnprocessableEntityException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt.guard";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthedRequestUser } from "../auth/roles.guard";

@Controller()
export class FavoritesController {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveGuest(guestId?: string): Promise<true | null> {
    if (!guestId) return null;
    const exists = await this.prisma.guestSession.findUnique({ where: { id: guestId } });
    if (!exists) {
      const e = new UnprocessableEntityException("Unknown guestSessionId");
      throw e;
    }
    return true;
  }

  private owner(reqOwner: AuthedRequestUser | undefined, guestId?: string) {
    if (reqOwner) return { userId: reqOwner.id };
    if (guestId) return { guestSessionId: guestId };
    throw new UnprocessableEntityException("Authentication or guestSessionId is required");
  }

  @Get("favorites")
  @UseGuards(OptionalJwtAuthGuard)
  async list(
    @Query("guestSessionId") guestId: string | undefined,
    @CurrentUser() user: AuthedRequestUser | undefined,
  ) {
    const where = user ? { userId: user.id } : guestId ? { guestSessionId: guestId } : {};
    if (!user && !guestId) return { favorites: [] };
    if (guestId) await this.resolveGuest(guestId);
    const favorites = await this.prisma.favorite.findMany({
      where,
      include: { unit: { include: { unitType: true, floor: { include: { building: true } } } } },
    });
    return { favorites };
  }

  @Post("favorites")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(201)
  async add(@Body() body: any, @CurrentUser() user?: AuthedRequestUser) {
    const unitId = body.unitId;
    const guestSessionId = body.guestSessionId;
    if (!unitId) throw new UnprocessableEntityException("unitId is required");
    if (user && guestSessionId) {
      throw new UnprocessableEntityException(
        "Provide either authentication or guestSessionId, not both",
      );
    }
    if (!user && !guestSessionId)
      throw new UnprocessableEntityException("Authentication or guestSessionId is required");
    if (guestSessionId) await this.resolveGuest(guestSessionId);
    const data: any = { unitId };
    if (user) data.userId = user.id;
    else data.guestSessionId = guestSessionId;
    try {
      const fav = await this.prisma.favorite.create({ data });
      return { ok: true, id: fav.id };
    } catch (e: any) {
      if (String(e?.message ?? "").includes("Unique constraint")) {
        throw new ConflictException("Already favorited");
      }
      throw e;
    }
  }

  @Delete("favorites/:id")
  @UseGuards(OptionalJwtAuthGuard)
  async remove(
    @Param("id") id: string,
    @Query("guestSessionId") guestId: string | undefined,
    @CurrentUser() user?: AuthedRequestUser,
  ) {
    const fav = await this.prisma.favorite.findUnique({ where: { id } });
    if (!fav) return { ok: true };
    if (user && fav.userId && fav.userId !== user.id) throw new NotFoundException();
    if (!user && fav.userId && !(fav.guestSessionId && fav.guestSessionId === guestId))
      throw new NotFoundException();
    await this.prisma.favorite.delete({ where: { id } });
    return { ok: true };
  }
}
