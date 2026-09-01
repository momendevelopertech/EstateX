import { Controller, Post, Get, Body, Query, UseGuards, HttpCode } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "../prisma/prisma.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthedRequestUser } from "../auth/roles.guard";

@Controller()
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post(["analytics/track", "analytics/events"])
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(202)
  async track(@Body() body: any, @CurrentUser() user?: AuthedRequestUser) {
    const { eventType, unitId, projectId, sessionId, metadata } = body;
    await this.prisma.analyticsEvent.create({
      data: {
        userId: user?.id ?? null,
        eventType: String(eventType ?? "unknown"),
        unitId: unitId ?? null,
        projectId: projectId ?? null,
        sessionId: sessionId ?? null,
        metadata: metadata ?? {},
      },
    });
    return { ok: true };
  }

  @Get(["analytics/overview", "analytics/dashboard"])
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager")
  async overview(@Query() q: any) {
    const days = Number(q.days ?? 30);
    const since = new Date(Date.now() - days * 86400000);
    const [views, leads, favorites, bookings, unitsByStatus] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { eventType: "unit_view", timestamp: { gte: since } },
      }),
      this.prisma.lead.count({ where: { createdAt: { gte: since } } }),
      this.prisma.favorite.count({ where: { createdAt: { gte: since } } }),
      this.prisma.booking.count({ where: { scheduledAt: { gte: since } } }),
      this.prisma.unit.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    return { views, leads, favorites, bookings, unitsByStatus };
  }

  @Get("analytics/kpis")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager")
  async kpis(@Query() q: any) {
    const days = Number(q.days ?? 30);
    const since = new Date(Date.now() - days * 86400000);
    const [views, leads, favorites, bookings, unitViews, revenueUnits] = await Promise.all([
      this.prisma.analyticsEvent.count({ where: { timestamp: { gte: since } } }),
      this.prisma.lead.count({ where: { createdAt: { gte: since } } }),
      this.prisma.favorite.count({ where: { createdAt: { gte: since } } }),
      this.prisma.booking.count({ where: { scheduledAt: { gte: since } } }),
      this.prisma.analyticsEvent.count({
        where: { eventType: "unit_view", timestamp: { gte: since } },
      }),
      this.prisma.unit.findMany({ where: { status: "sold" }, select: { price: true } }),
    ]);
    const soldRevenue = revenueUnits.reduce((sum: number, u: any) => sum + Number(u.price), 0);
    const conversionRate = views > 0 ? Number(((leads / views) * 100).toFixed(2)) : 0;
    return {
      periodDays: days,
      totalEvents: views,
      unitViews,
      leads,
      favorites,
      bookings,
      conversionRate,
      soldUnits: revenueUnits.length,
      soldRevenue,
    };
  }
}
