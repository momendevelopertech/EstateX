import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Phase 1 heuristics-only recommendations (01-overview.md §7 AI is Phase 4 R9; until then use
 * collaborative-style similarity). Model-backed recommendations slot in here later.
 */
@Controller("recommendations")
export class RecommendationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @UseGuards(AuthGuard("jwt"))
  async byNeeds(@Body() body: any) {
    const { budgetMax, budgetMin, bedrooms, bathrooms, projectId, limit } = body ?? {};
    const where: any = { status: { not: "hidden" } };
    if (budgetMax != null || budgetMin != null) {
      where.price = {};
      if (budgetMin != null) where.price.gte = Number(budgetMin);
      if (budgetMax != null) where.price.lte = Number(budgetMax);
    }
    if (bedrooms != null) where.unitType = { is: { bedrooms: Number(bedrooms) } };
    if (bathrooms != null) where.unitType = { is: { bathrooms: Number(bathrooms) } };
    if (projectId) where.floor = { is: { building: { is: { projectId } } } };
    const units = await this.prisma.unit.findMany({
      where,
      include: { unitType: true, floor: { include: { building: { include: { project: true } } } } },
      orderBy: { price: "asc" },
      take: Number(limit ?? 10),
    });
    return { recommendations: units };
  }

  @Get()
  @UseGuards(AuthGuard("jwt"))
  async forUser(@Query("unitId") unitId?: string, @Query("limit") limit?: string) {
    const take = Number(limit || 6);
    if (unitId) {
      const seed = await this.prisma.unit.findUnique({
        where: { id: unitId },
        include: { unitType: true, floor: { include: { building: true } } },
      });
      if (!seed) return { recommendations: [] };
      const recommendations = await this.prisma.unit.findMany({
        where: {
          status: { not: "hidden" },
          NOT: { id: seed.id },
          OR: [
            { unitTypeId: seed.unitTypeId },
            { price: { gte: Number(seed.price) * 0.7, lte: Number(seed.price) * 1.3 } },
            { floor: { building: { projectId: (seed.floor as any).building.projectId } } },
          ],
        },
        include: { unitType: true },
        take,
        orderBy: { price: "asc" },
      });
      return { recommendations };
    }
    // Cold start: best-priced available units.
    const recommendations = await this.prisma.unit.findMany({
      where: { status: { not: "hidden" } },
      include: { unitType: true },
      orderBy: { price: "asc" },
      take,
    });
    return { recommendations };
  }
}
