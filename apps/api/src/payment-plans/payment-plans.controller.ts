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
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "../prisma/prisma.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";

@Controller()
export class PaymentPlansController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("payment-plans")
  async list(@Query("projectId") projectId?: string, @Query("unitId") unitId?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (unitId) where.unitId = unitId;
    const plans = await this.prisma.paymentPlan.findMany({ where });
    return { plans };
  }

  @Post("payment-plans")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager")
  @HttpCode(201)
  async create(@Body() body: any) {
    const {
      name,
      projectId,
      unitId,
      downPaymentPercent,
      numberOfInstallments,
      installmentFrequency,
      deliveryLinkedPercent,
      notes,
    } = body;
    if (!name || downPaymentPercent == null || numberOfInstallments == null) {
      throw new UnprocessableEntityException(
        "name, downPaymentPercent and numberOfInstallments are required",
      );
    }
    if (!projectId && !unitId)
      throw new UnprocessableEntityException("projectId or unitId required");
    const down = Number(downPaymentPercent);
    const linked = deliveryLinkedPercent != null ? Number(deliveryLinkedPercent) : 0;
    if (down <= 0 || down > 100) {
      throw new UnprocessableEntityException("downPaymentPercent must be between 0 and 100");
    }
    if (linked < 0 || linked > 100 || down + linked > 100) {
      throw new UnprocessableEntityException(
        "Payment plan percentages must be between 0 and 100 and sum to no more than 100",
      );
    }
    const plan = await this.prisma.paymentPlan.create({
      data: {
        name,
        projectId: projectId ?? null,
        unitId: unitId ?? null,
        downPaymentPercent: down,
        numberOfInstallments: Number(numberOfInstallments),
        installmentFrequency: installmentFrequency,
        deliveryLinkedPercent: linked > 0 ? linked : null,
        notes: notes,
      },
    });
    return { ok: true, id: plan.id };
  }

  @Patch("payment-plans/:id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Super Admin", "Sales Manager")
  async update(@Param("id") id: string, @Body() body: any) {
    const existing = await this.prisma.paymentPlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Payment plan not found");
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.downPaymentPercent !== undefined)
      data.downPaymentPercent = Number(body.downPaymentPercent);
    if (body.numberOfInstallments !== undefined)
      data.numberOfInstallments = Number(body.numberOfInstallments);
    if (body.installmentFrequency !== undefined)
      data.installmentFrequency = body.installmentFrequency;
    if (body.deliveryLinkedPercent !== undefined)
      data.deliveryLinkedPercent = Number(body.deliveryLinkedPercent);
    if (body.notes !== undefined) data.notes = body.notes;
    if (data.downPaymentPercent !== undefined || data.deliveryLinkedPercent !== undefined) {
      const d = data.downPaymentPercent ?? existing.downPaymentPercent;
      const l = data.deliveryLinkedPercent ?? existing.deliveryLinkedPercent ?? 0;
      if (
        Number(d) <= 0 ||
        Number(d) > 100 ||
        Number(l) < 0 ||
        Number(l) > 100 ||
        Number(d) + Number(l) > 100
      ) {
        throw new UnprocessableEntityException(
          "Payment plan percentages must be between 0 and 100 and sum to no more than 100",
        );
      }
    }
    const plan = await this.prisma.paymentPlan.update({ where: { id }, data });
    return { ok: true, plan };
  }

  /**
   * FR-54 client-adjustable installment calculator:
   * { downPaymentPercent?, months? } -> recalculated schedule out.
   * Total price resolves to the unit price for unit plans, else project starting price.
   */
  @Post("payment-plans/:id/calculate")
  async calculate(@Param("id") id: string, @Body() body: any) {
    const plan = await this.prisma.paymentPlan.findUnique({
      where: { id },
      include: { unit: true, project: true },
    });
    if (!plan) throw new NotFoundException("Payment plan not found");
    const downPct = Number(body.downPaymentPercent ?? plan.downPaymentPercent);
    const months = Number(body.months ?? plan.numberOfInstallments);
    const total = plan.unit
      ? Number(plan.unit.price)
      : plan.project
        ? Number(plan.project.startingPrice)
        : 0;
    if (total <= 0)
      throw new UnprocessableEntityException("No unit/project price to calculate against");
    if (downPct <= 0 || downPct > 100)
      throw new UnprocessableEntityException("downPaymentPercent must be 0-100");
    if (months <= 0 || months > 360) throw new UnprocessableEntityException("months must be 1-360");
    const downPayment = Math.round((total * downPct) / 100);
    const financed = total - downPayment;
    const perInstallment = Math.round(financed / months);

    let schedule: Array<{ number: number; dueAt: string; grossDue: number }> = [];
    if (financed > 0) {
      const start = new Date(Date.now() + 30 * 86400000);
      schedule = Array.from({ length: months }, (_, i) => {
        const due = new Date(start);
        due.setUTCMonth(due.getUTCMonth() + i);
        return { number: i + 1, dueAt: due.toISOString().slice(0, 10), grossDue: perInstallment };
      });
    }

    return {
      planId: plan.id,
      totalPrice: total,
      downPaymentPercent: downPct,
      downPayment,
      financed,
      months,
      perInstallment,
      schedule,
    };
  }
}
