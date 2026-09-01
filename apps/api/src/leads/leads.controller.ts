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
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "../prisma/prisma.service";
import { EventsService } from "../notifications/events.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthedRequestUser } from "../auth/roles.guard";

@Controller()
export class LeadsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  @Post("leads")
  @HttpCode(201)
  async createLead(@Body() body: any) {
    const { unitId, name, phone, email, message, source, userId, guestContact } = body;
    if (!unitId || (!name && !phone && !email)) {
      throw new UnprocessableEntityException(
        "unitId and at least one of name/phone/email are required",
      );
    }
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { floor: { include: { building: true } } },
    });
    if (!unit) throw new NotFoundException("Unit not found");
    const projectId = (unit.floor as any).building.projectId;

    const contact = {
      name: name ?? null,
      phone: phone ?? null,
      email: email ?? null,
      ...(guestContact ?? {}),
    };
    const lead = await this.prisma.lead.create({
      data: {
        unitId,
        projectId,
        userId: userId ?? null,
        guestContact: contact,
        source: source ?? "web",
        message: message ?? null,
        status: "new",
      },
    });
    await this.events.newLead(lead.id, null);
    return { ok: true, id: lead.id };
  }

  @Get("leads")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager", "Agent")
  async listLeads(@Query() q: any) {
    const where: any = {};
    if (q.status) where.status = q.status;
    if (q.projectId)
      where.unit = { is: { floor: { is: { building: { is: { projectId: q.projectId } } } } } };
    const leads = await this.prisma.lead.findMany({
      where,
      include: { unit: { include: { unitType: true } } },
      orderBy: { createdAt: "desc" },
      take: Number(q.limit || 100),
    });
    return { leads };
  }

  @Patch("leads/:id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager", "Agent")
  async updateLead(@Param("id") id: string, @Body() body: any) {
    const data: any = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.assignedAgentId !== undefined) data.assignedAgentId = body.assignedAgentId;
    if (Object.keys(data).length === 0) throw new UnprocessableEntityException("Nothing to update");
    const lead = await this.prisma.lead.update({ where: { id }, data, include: { unit: true } });
    if (data.assignedAgentId || lead.assignedAgentId) {
      await this.events.newLead(lead.id, data.assignedAgentId ?? lead.assignedAgentId);
    }
    return { ok: true, lead };
  }

  @Post("bookings")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(201)
  async createBooking(@Body() body: any, @CurrentUser() user: AuthedRequestUser) {
    const { unitId, scheduledAt } = body;
    if (!unitId) throw new UnprocessableEntityException("unitId is required");
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { floor: { include: { building: true } } },
    });
    if (!unit) throw new NotFoundException("Unit not found");
    if (unit.status === "sold") throw new ForbiddenException("Unit is already sold");
    // A booking belongs to a lead (Booking.leadId is required); derive the project.
    const projectId = (unit.floor as any).building.projectId;
    const lead = await this.prisma.lead.create({
      data: {
        unitId,
        projectId,
        userId: user.id,
        source: "booking",
        status: "new",
      },
    });
    const booking = await this.prisma.booking.create({
      data: {
        leadId: lead.id,
        unitId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        status: "pending",
      },
    });
    await this.events.bookingConfirmed(booking.id, { email: user.email });
    return { ok: true, id: booking.id };
  }

  @Get("bookings/me")
  @UseGuards(AuthGuard("jwt"))
  async myBookings(@CurrentUser() user: AuthedRequestUser) {
    const bookings = await this.prisma.booking.findMany({
      where: { lead: { userId: user.id } },
      include: { unit: { include: { unitType: true } } },
      orderBy: { scheduledAt: "desc" },
    });
    return { bookings };
  }

  @Patch("bookings/:id/status")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager", "Agent")
  async updateBookingStatus(@Param("id") id: string, @Body() body: any) {
    const status = String(body.status ?? "");
    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      throw new UnprocessableEntityException(
        "status must be one of pending/confirmed/completed/cancelled",
      );
    }
    const booking = await this.prisma.booking.update({
      where: { id },
      data: { status: status as any },
      include: { unit: true },
    });
    return { ok: true, booking };
  }
}
