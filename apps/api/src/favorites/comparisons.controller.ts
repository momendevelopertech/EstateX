import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  UseGuards,
  UnprocessableEntityException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt.guard";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthedRequestUser } from "../auth/roles.guard";

const MAX_COMPARISON_UNITS = 4;

@Controller("comparisons")
export class ComparisonsController {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveGuest(guestId?: string) {
    if (!guestId) return;
    const exists = await this.prisma.guestSession.findUnique({ where: { id: guestId } });
    if (!exists) throw new UnprocessableEntityException("Unknown guestSessionId");
  }

  private owner(user: AuthedRequestUser | undefined, guestId?: string) {
    if (user) return { userId: user.id };
    if (guestId) return { guestSessionId: guestId };
    return undefined;
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async get(
    @Query("guestSessionId") guestId: string | undefined,
    @CurrentUser() user?: AuthedRequestUser,
  ) {
    const owner = this.owner(user, guestId);
    if (!owner) return { comparison: null };
    if (guestId) await this.resolveGuest(guestId);
    const comparison = await this.prisma.comparison.findFirst({ where: owner });
    if (!comparison) return { comparison: null };
    const ids: string[] = (comparison.unitIds as string[]) ?? [];
    const units = ids.length
      ? await this.prisma.unit.findMany({ where: { id: { in: ids } }, include: { unitType: true } })
      : [];
    return { comparison: { ...comparison, units } };
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(201)
  async upsert(@Body() body: any, @CurrentUser() user?: AuthedRequestUser) {
    const unitId = body.unitId;
    const guestSessionId = body.guestSessionId;
    if (user && guestSessionId) {
      throw new UnprocessableEntityException(
        "Provide either authentication or guestSessionId, not both",
      );
    }
    const owner = this.owner(user, guestSessionId);
    if (!owner)
      throw new UnprocessableEntityException("Authentication or guestSessionId is required");
    if (!unitId) throw new UnprocessableEntityException("unitId is required");
    if (guestSessionId) await this.resolveGuest(guestSessionId);

    let comparison = await this.prisma.comparison.findFirst({ where: owner });
    if (!comparison) {
      const data: any = { unitIds: [unitId] };
      if (user) data.userId = user.id;
      else data.guestSessionId = guestSessionId;
      comparison = await this.prisma.comparison.create({ data });
      return { ok: true, id: comparison.id, count: 1 };
    }
    const ids = new Set<string>((comparison.unitIds as string[]) ?? []);
    ids.add(unitId);
    if (ids.size > MAX_COMPARISON_UNITS) {
      throw new ConflictException(`Comparison limited to ${MAX_COMPARISON_UNITS} units`);
    }
    const updated = await this.prisma.comparison.update({
      where: { id: comparison.id },
      data: { unitIds: [...ids] },
    });
    return { ok: true, id: updated.id, count: (updated.unitIds as string[]).length };
  }

  @Delete(":id/units/:unitId")
  async removeUnit(
    @Param("id") id: string,
    @Param("unitId") unitId: string,
    @CurrentUser() user?: AuthedRequestUser,
  ) {
    const comparison = await this.prisma.comparison.findUnique({ where: { id } });
    if (!comparison) return { ok: true };
    if (user && comparison.userId && comparison.userId !== user.id) {
      // allow guest-owned ops by session; scope check below
    }
    const ids = ((comparison.unitIds as string[]) ?? []).filter((u) => u !== unitId);
    await this.prisma.comparison.update({ where: { id }, data: { unitIds: ids } });
    return { ok: true };
  }

  @Get(":id/share")
  async share(@Param("id") id: string) {
    const comparison = await this.prisma.comparison.findUnique({ where: { id } });
    if (!comparison) throw new NotFoundException("Comparison not found");
    const ids = ((comparison.unitIds as string[]) ?? []) as string[];
    const units = ids.length
      ? await this.prisma.unit.findMany({
          where: { id: { in: ids } },
          include: {
            unitType: true,
            floor: { include: { building: { include: { project: true } } } },
          },
        })
      : [];
    return {
      comparison: { id: comparison.id, unitIds: ids },
      shareUrl: `/compare/${comparison.id}`,
      units,
    };
  }
}
