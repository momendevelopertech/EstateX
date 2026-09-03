import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "../prisma/prisma.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";

@Controller()
export class ProjectsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("projects")
  async list(@Query() q: any) {
    const where: any = {};
    if (q.name) where.name = { contains: String(q.name), mode: "insensitive" };
    if (q.location) where.location = { contains: String(q.location), mode: "insensitive" };
    if (q.priceMax) where.startingPrice = { lte: Number(q.priceMax) };
    const projects = await this.prisma.project.findMany({
      where,
      include: { developer: true },
      orderBy: { launchDate: "desc" },
    });
    // Annotate with available-unit count
    const annotated = await Promise.all(
      projects.map(async (p) => {
        const available = await this.prisma.unit.count({
          where: { status: "available", floor: { building: { projectId: p.id } } },
        });
        const hero = p.heroMediaId
          ? await this.prisma.media.findUnique({ where: { id: p.heroMediaId } })
          : null;
        return { ...p, availableUnits: available, heroImageUrl: hero?.url ?? null };
      }),
    );
    return { projects: annotated };
  }

  @Get("projects/:key")
  async detail(@Param("key") key: string) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: key }, { slug: key }] },
      include: {
        developer: true,
        buildings: { include: { _count: { select: { floors: true } } } },
        amenities: true,
        pois: { orderBy: { distanceMinutes: "asc" } },
      },
    });
    if (!project) throw new NotFoundException("Project not found");
    const hero = project.heroMediaId
      ? await this.prisma.media.findUnique({ where: { id: project.heroMediaId } })
      : null;
    return { project: { ...project, heroImageUrl: hero?.url ?? null } };
  }

  @Get("projects/:id/pois")
  async pois(@Param("id") id: string) {
    const pois = await this.prisma.locationPOI.findMany({
      where: { projectId: id },
      orderBy: { distanceMinutes: "asc" },
    });
    return { pois };
  }

  @Get("projects/:id/amenities")
  async amenities(@Param("id") id: string) {
    const amenities = await this.prisma.amenity.findMany({ where: { projectId: id } });
    return { amenities };
  }

  @Get("projects/:id/masterplan")
  async masterplan(@Param("id") id: string) {
    const units = await this.prisma.unit.findMany({
      where: { floor: { building: { projectId: id } } },
      include: { floor: { include: { building: true } }, unitType: true },
      orderBy: { unitNumber: "asc" },
    });
    // Live statuses (FR-08) — one source of truth, no cached copies.
    return { units };
  }

  @Post("projects")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin")
  @HttpCode(201)
  async create(@Body() body: any) {
    const {
      name,
      slug,
      developerId,
      description,
      latitude,
      longitude,
      startingPrice,
      baseCurrency,
      status,
      launchDate,
    } = body;
    if (!name || !slug || !developerId || startingPrice == null) {
      throw new UnprocessableEntityException(
        "name, slug, developerId and startingPrice are required",
      );
    }
    const project = await this.prisma.project.create({
      data: {
        name,
        slug,
        developerId,
        description,
        latitude: latitude != null ? Number(latitude) : undefined,
        longitude: longitude != null ? Number(longitude) : undefined,
        startingPrice: Number(startingPrice),
        baseCurrency: baseCurrency ?? "EGP",
        status: status ?? "under_construction",
        launchDate: launchDate ? new Date(launchDate) : undefined,
      },
    });
    return { ok: true, id: project.id };
  }

  @Patch("projects/:id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin")
  async update(@Param("id") id: string, @Body() body: any) {
    const data: any = {};
    const numeric = ["latitude", "longitude", "startingPrice"] as const;
    for (const f of numeric) if (body[f] !== undefined) data[f] = Number(body[f]);
    const str = ["name", "slug", "description", "status", "baseCurrency", "heroMediaId"] as const;
    for (const f of str) if (body[f] !== undefined) data[f] = body[f];
    if (body.launchDate !== undefined) data.launchDate = new Date(body.launchDate);
    if (Object.keys(data).length === 0) throw new UnprocessableEntityException("Nothing to update");
    const project = await this.prisma.project.update({ where: { id }, data });
    return { ok: true, project };
  }

  @Delete("projects/:id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin")
  async remove(@Param("id") id: string) {
    await this.prisma.project.delete({ where: { id } });
    return { ok: true };
  }
}
