import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  UnprocessableEntityException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "../prisma/prisma.service";
import { UnitsService, UnitStatusConflictError } from "./units.service";
import { EventsService } from "../notifications/events.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthedRequestUser } from "../auth/roles.guard";

const VALID_STATUSES = ["available", "reserved", "sold", "hidden"] as const;

@Controller()
export class UnitsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly units: UnitsService,
    private readonly events: EventsService,
  ) {}

  @Get("floors/:floorId/units")
  async floorUnits(@Param("floorId") floorId: string) {
    const units = await this.prisma.unit.findMany({
      where: { floorId },
      include: { unitType: true },
      orderBy: { unitNumber: "asc" },
    });
    return { units };
  }

  @Get("units")
  async search(@Query() q: any) {
    const where: any = {};
    if (q.priceMin || q.priceMax) {
      where.price = {};
      if (q.priceMin) where.price.gte = Number(q.priceMin);
      if (q.priceMax) where.price.lte = Number(q.priceMax);
    }
    if (q.areaMin || q.areaMax) {
      where.area = {};
      if (q.areaMin) where.area.gte = Number(q.areaMin);
      if (q.areaMax) where.area.lte = Number(q.areaMax);
    }
    if (q.bedrooms) where.unitType = { is: { bedrooms: Number(q.bedrooms) } };
    if (q.unitTypeId) where.unitTypeId = String(q.unitTypeId);
    if (q.floor) {
      const floorNum = Number(q.floor);
      where.floor = { is: { number: floorNum } };
    }
    if (q.status) where.status = String(q.status);
    if (q.view) where.view = String(q.view);
    if (q.balcony === "true" || q.balcony === "1") where.hasBalcony = true;
    if (q.terrace === "true" || q.terrace === "1") where.hasTerrace = true;
    if (q.parking === "true" || q.parking === "1") where.parkingSpots = { gt: 0 };
    if (q.garden === "true" || q.garden === "1") where.hasGarden = true;
    if (q.hidden === "true") {
      // keep
    } else {
      // buyers don't see hidden units by default
      where.status = where.status ?? { not: "hidden" };
    }

    const units = await this.prisma.unit.findMany({
      where,
      include: {
        unitType: true,
        floor: { include: { building: { include: { project: true } } } },
      },
      orderBy: { price: "asc" },
      take: Number(q.limit || 100),
    });
    return { units };
  }

  @Get("units/:id")
  async detail(@Param("id") id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        unitType: true,
        floor: { include: { building: { include: { project: true } } } },
        priceHistory: { orderBy: { changedAt: "desc" } },
        paymentPlans: true,
        virtualTours: { include: { scenes: { orderBy: { order: "asc" } } } },
      },
    });
    if (!unit) throw new NotFoundException("Unit not found");
    return { unit };
  }

  @Get("units/:id/price-history")
  async priceHistory(@Param("id") id: string) {
    const history = await this.prisma.priceHistory.findMany({
      where: { unitId: id },
      orderBy: { changedAt: "desc" },
    });
    return { history };
  }

  @Get("units/:id/payment-plan")
  async effectivePlan(@Param("id") id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        floor: { include: { building: { include: { project: true } } } },
        paymentPlans: true,
      },
    });
    if (!unit) throw new NotFoundException("Unit not found");
    const unitOverrides = unit.paymentPlans;
    const projectPlans = unit
      ? await this.prisma.paymentPlan.findMany({
          where: { projectId: (unit.floor as any).building.projectId },
        })
      : [];
    // Unit override wins over project default (03-database-schema.md §8.5).
    const effective = unitOverrides.length ? unitOverrides : projectPlans;
    return { plans: effective };
  }

  @Post("units")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager")
  @HttpCode(201)
  async create(@Body() body: any, @CurrentUser() user: AuthedRequestUser) {
    const { floorId, unitNumber, unitTypeId, area, price, status } = body;
    if (!floorId || !unitNumber || area == null || price == null) {
      throw new UnprocessableEntityException("floorId, unitNumber, area and price are required");
    }
    try {
      const unit = await this.prisma.unit.create({
        data: {
          floorId,
          unitNumber,
          unitTypeId: unitTypeId || null,
          area: Number(area),
          price: Number(price),
          status: status ?? "available",
          statusVersion: 0,
        },
      });
      await this.prisma.auditLog.create({
        data: { userId: user.id, action: "create", entity: "Unit", entityId: unit.id },
      });
      return { ok: true, id: unit.id };
    } catch (e: any) {
      if (String(e?.message ?? "").includes("Unique constraint")) {
        throw new ConflictException("Unit number already exists on this floor");
      }
      throw e;
    }
  }

  @Patch("units/:id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager")
  async update(@Param("id") id: string, @Body() body: any, @CurrentUser() user: AuthedRequestUser) {
    const data: any = {};
    if (body.price !== undefined) {
      data.price = Number(body.price);
      // log price history (FR-56)
      const existing = await this.prisma.unit.findUnique({ where: { id } });
      if (existing && Number(existing.price) !== Number(body.price)) {
        await this.prisma.priceHistory.create({
          data: {
            unitId: id,
            oldPrice: existing.price,
            newPrice: Number(body.price),
            changedByUserId: user.id,
          },
        });
      }
    }
    if (body.area !== undefined) data.area = Number(body.area);
    if (body.unitTypeId !== undefined) data.unitTypeId = body.unitTypeId || null;
    if (body.view !== undefined) data.view = body.view;
    if (body.orientation !== undefined) data.orientation = body.orientation;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;

    if (Object.keys(data).length === 0) {
      throw new UnprocessableEntityException("Nothing to update");
    }
    const unit = await this.prisma.unit.update({ where: { id }, data });
    return { ok: true, unit };
  }

  @Patch("units/:id/status")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager")
  async updateStatus(
    @Param("id") id: string,
    @Body() body: any,
    @CurrentUser() user: AuthedRequestUser,
  ) {
    const status = String(body.status ?? "");
    const expectedVersion = Number(body.expectedVersion ?? body.statusVersion);
    if ((VALID_STATUSES as readonly string[]).indexOf(status) === -1) {
      throw new UnprocessableEntityException("Invalid status");
    }
    if (Number.isNaN(expectedVersion)) {
      throw new UnprocessableEntityException(
        "expectedVersion is required for concurrency-safe update",
      );
    }
    try {
      const result = await this.units.transitionStatus(id, status as any, expectedVersion, user.id);
      return result;
    } catch (e) {
      if (e instanceof UnitStatusConflictError) {
        // Exact 409 shape per 04-api-spec.md.
        throw new ConflictException({
          error: "UNIT_STATUS_CONFLICT",
          message: "This unit's status has changed since you last viewed it.",
          current: e.current,
        });
      }
      throw e;
    }
  }

  /**
   * FR-43 bulk import: upload → validate → preview → confirm.
   * Body: { text: "csv...", preview: true } and/or { rows: [...] }.
   * Header row: floorId,unitNumber,unitTypeId,area,price,status
   * preview=true only validates; confirm=false persists (each created unit gets a fresh statusVersion).
   */
  @Post("units/import")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager")
  async importUnits(@Body() body: any, @CurrentUser() user: AuthedRequestUser) {
    const preview = body.preview === true;
    let rows: Array<Record<string, string>> = Array.isArray(body.rows) ? body.rows : [];
    if (typeof body.text === "string" && body.text.trim()) {
      const parsed = this.parseCsvUnits(body.text);
      if (!parsed.ok) {
        throw new ConflictException({ error: "IMPORT_PARSE_ERROR", message: parsed.error });
      }
      rows = parsed.rows;
    }
    if (rows.length === 0) {
      throw new UnprocessableEntityException("No rows provided (send rows[] or CSV text)");
    }

    const valid: any[] = [];
    const invalid: Array<{ row: number; reason: string }> = [];
    const seen = new Set<string>();
    rows.forEach((r, i) => {
      const rowNo = i + 2; // +2: header is row 1
      const floorId = String(r.floorId ?? "").trim();
      const unitNumber = String(r.unitNumber ?? "").trim();
      const area = Number(r.area);
      const price = Number(r.price);
      const status = String(r.status ?? "available").trim();
      const unitTypeId = String(r.unitTypeId ?? "").trim() || null;
      const key = `${floorId}|${unitNumber}`;
      if (
        !floorId ||
        !unitNumber ||
        !Number.isFinite(area) ||
        area <= 0 ||
        !Number.isFinite(price) ||
        price <= 0
      ) {
        invalid.push({
          row: rowNo,
          reason: "floorId, unitNumber, area>0 and price>0 are required",
        });
        return;
      }
      if (!(VALID_STATUSES as readonly string[]).includes(status as any)) {
        invalid.push({ row: rowNo, reason: `invalid status '${status}'` });
        return;
      }
      if (seen.has(key)) {
        invalid.push({ row: rowNo, reason: "duplicate floorId+unitNumber in this upload" });
        return;
      }
      seen.add(key);
      valid.push({ floorId, unitNumber, unitTypeId, area, price, status });
    });

    if (preview) {
      return {
        preview: true,
        validCount: valid.length,
        invalidCount: invalid.length,
        valid,
        invalid,
      };
    }

    if (invalid.length > 0) {
      // Validator-pass required before confirm (FR-43).
      throw new ConflictException({
        error: "IMPORT_VALIDATION_FAILED",
        message: `${invalid.length} row(s) failed validation`,
        invalid,
      });
    }

    let imported = 0;
    const duplicates: string[] = [];
    for (const row of valid) {
      const exists = await this.prisma.unit.findUnique({
        where: { floorId_unitNumber: { floorId: row.floorId, unitNumber: row.unitNumber } },
      });
      if (exists) {
        duplicates.push(row.unitNumber);
        continue;
      }
      await this.prisma.unit.create({
        data: {
          floorId: row.floorId,
          unitNumber: row.unitNumber,
          unitTypeId: row.unitTypeId,
          area: row.area,
          price: row.price,
          status: row.status,
          statusVersion: 0,
        },
      });
      imported++;
    }
    await this.prisma.auditLog.create({
      data: { userId: user.id, action: "import", entity: "Unit", entityId: null },
    });
    await this.events.importCompleted({ imported, failed: invalid.length + duplicates.length });
    return { ok: true, imported, skippedDuplicates: duplicates.length, failed: invalid.length };
  }

  private parseCsvUnits(
    text: string,
  ): { ok: true; rows: Array<Record<string, string>> } | { ok: false; error: string } {
    try {
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const header =
        lines
          .shift()
          ?.split(",")
          .map((h) => h.trim().replace(/^"|"$/g, "")) ?? [];
      const expected = ["floorId", "unitNumber", "area", "price"];
      for (const h of expected) {
        if (!header.includes(h)) return { ok: false, error: `Missing header column '${h}'` };
      }
      const rows = lines.map((line) => {
        const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const row: Record<string, string> = {};
        header.forEach((h, i) => (row[h] = cells[i] ?? ""));
        return row;
      });
      return { ok: true, rows };
    } catch {
      return { ok: false, error: "Could not parse CSV payload" };
    }
  }
}
