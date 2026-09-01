import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  UnprocessableEntityException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "../prisma/prisma.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";

@Controller()
export class BuildingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("buildings/:id/floors")
  async floors(@Param("id") id: string) {
    const floors = await this.prisma.floor.findMany({
      where: { buildingId: id },
      include: { _count: { select: { units: true } } },
      orderBy: { number: "asc" },
    });
    return { floors };
  }

  @Post("buildings")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin")
  @HttpCode(201)
  async createBuilding(@Body() body: any) {
    const { projectId, name, floorsCount, zoneId } = body;
    if (!projectId || !name)
      throw new UnprocessableEntityException("projectId and name are required");
    return this.prisma.building.create({
      data: { projectId, name, floorsCount: Number(floorsCount ?? 1), zoneId: zoneId ?? null },
    });
  }

  @Post("floors")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin")
  @HttpCode(201)
  async createFloor(@Body() body: any) {
    const { buildingId, number } = body;
    if (!buildingId || number == null)
      throw new UnprocessableEntityException("buildingId and number are required");
    return this.prisma.floor.create({ data: { buildingId, number: Number(number) } });
  }
}
