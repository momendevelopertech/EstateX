import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  UnprocessableEntityException,
  NotFoundException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "../prisma/prisma.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";

@Controller()
export class ToursController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(["units/:id/virtual-tours", "units/:id/tours"])
  async byUnit(@Param("id") id: string) {
    const tours = await this.prisma.virtualTour.findMany({
      where: { unitId: id },
      include: { scenes: { orderBy: { order: "asc" } } },
    });
    return { tours };
  }

  @Get(["virtual-tours/:id", "tours/:id"])
  async detail(@Param("id") id: string) {
    const tour = await this.prisma.virtualTour.findUnique({
      where: { id },
      include: { scenes: { orderBy: { order: "asc" } }, unit: { include: { unitType: true } } },
    });
    if (!tour) throw new NotFoundException("Tour not found");
    return { tour };
  }

  @Get(["virtual-tours/:id/scenes", "tours/:id/scenes"])
  async scenes(@Param("id") id: string) {
    const scenes = await this.prisma.virtualTourScene.findMany({
      where: { virtualTourId: id },
      include: { hotspotsFrom: true },
      orderBy: { order: "asc" },
    });
    return { scenes };
  }

  @Post(["virtual-tours", "tours"])
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager", "Agent")
  @HttpCode(201)
  async create(@Body() body: any) {
    const { unitId, name } = body;
    if (!unitId) throw new UnprocessableEntityException("unitId is required");
    const tour = await this.prisma.virtualTour.create({
      data: { unitId, name: name ?? "Unit Tour" },
    });
    return { ok: true, id: tour.id, type: "virtual-tour" };
  }

  @Post(["virtual-tours/:id/scenes", "tours/:id/scenes"])
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager", "Agent")
  @HttpCode(201)
  async createScene(@Param("id") id: string, @Body() body: any) {
    const { roomName, panoramaUrl, order, areaSqm } = body;
    if (!roomName || !panoramaUrl)
      throw new UnprocessableEntityException("roomName and panoramaUrl are required");
    const scene = await this.prisma.virtualTourScene.create({
      data: {
        virtualTourId: id,
        roomName,
        panoramaUrl,
        order: Number(order ?? 0),
        areaSqm: areaSqm != null ? Number(areaSqm) : null,
      },
    });
    return { ok: true, id: scene.id };
  }

  @Post("hotspots")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager", "Agent")
  @HttpCode(201)
  async createHotspot(@Body() body: any) {
    const { sceneId, targetSceneId, type, xPosition, yPosition, label } = body;
    if (!sceneId || xPosition == null || yPosition == null)
      throw new UnprocessableEntityException("sceneId, xPosition and yPosition are required");
    const hp = await this.prisma.hotspot.create({
      data: {
        sceneId,
        targetSceneId: targetSceneId ?? null,
        type: type ?? "navigation",
        xPosition: Number(xPosition),
        yPosition: Number(yPosition),
        label: label ?? null,
      },
    });
    return { ok: true, id: hp.id };
  }
}
