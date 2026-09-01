import { Controller, Get, Param, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

// Phase 4 surface: public developer profiles + verified projects.
@Controller("developers")
export class DevelopersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() q: any) {
    const developers = await this.prisma.developer.findMany({
      where: q.name ? { name: { contains: String(q.name) } } : undefined,
      include: { _count: { select: { projects: true } } },
    });
    return { developers };
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const developer = await this.prisma.developer.findUnique({
      where: { id },
      include: { projects: true, agents: { include: { user: true } } },
    });
    return { developer };
  }
}
