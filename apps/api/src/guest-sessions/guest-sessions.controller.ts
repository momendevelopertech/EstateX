import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  NotFoundException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("guest-sessions")
export class GuestSessionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() body: { ttlDays?: number }) {
    const ttlDays = Number(body.ttlDays ?? 30);
    const session = await this.prisma.guestSession.create({
      data: {
        expiresAt: new Date(Date.now() + ttlDays * 86400000),
      },
    });
    return { id: session.id, expiresAt: session.expiresAt };
  }

  /**
   * FR-32: on registration, merge the guest session's favorites/comparisons into the
   * authenticated account and stamp GuestSession.convertedToUserId.
   */
  @Post(":id/merge")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(200)
  async merge(@Param("id") id: string, @CurrentUser() user: any) {
    const session = await this.prisma.guestSession.findUnique({
      where: { id },
      include: { favorites: true, comparisons: true },
    });
    if (!session) throw new NotFoundException("Guest session not found");

    // Favorites: copy each guest favorite a userId-less row (skip ones the user already has).
    const userFavs = new Set(
      (
        await this.prisma.favorite.findMany({
          where: { userId: user.id },
          select: { unitId: true },
        })
      ).map((f) => f.unitId),
    );
    for (const fav of session.favorites) {
      if (userFavs.has(fav.unitId)) continue;
      if (fav.userId) continue;
      await this.prisma.favorite.create({ data: { userId: user.id, unitId: fav.unitId } });
    }

    // Comparisons: union unitIds into the user's existing comparison (or create one).
    const guestUnitIds = new Set<string>();
    for (const c of session.comparisons) {
      for (const u of (c.unitIds as string[]) ?? []) guestUnitIds.add(u);
    }
    if (guestUnitIds.size > 0) {
      const userCmp = await this.prisma.comparison.findFirst({ where: { userId: user.id } });
      const merged = Array.from(
        new Set<string>([
          ...(userCmp ? ((userCmp.unitIds as string[]) ?? []) : []),
          ...guestUnitIds,
        ]),
      ).slice(0, 4);
      if (userCmp) {
        await this.prisma.comparison.update({
          where: { id: userCmp.id },
          data: { unitIds: merged },
        });
      } else {
        await this.prisma.comparison.create({ data: { userId: user.id, unitIds: merged } });
      }
    }

    await this.prisma.guestSession.update({
      where: { id },
      data: { convertedToUserId: user.id },
    });
    return {
      ok: true,
      mergedFavorites: session.favorites.length,
      mergedComparisons: session.comparisons.length,
    };
  }
}
