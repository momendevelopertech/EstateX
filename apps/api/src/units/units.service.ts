import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UnitStatus } from "@prisma/client";
import { EventsService } from "../notifications/events.service";

export class UnitStatusConflictError extends Error {
  constructor(
    public readonly current: {
      unitId: string;
      status: UnitStatus;
      statusVersion: number;
      holdExpiresAt: Date | null;
    },
  ) {
    super("UNIT_STATUS_CONFLICT");
    this.name = "UnitStatusConflictError";
  }
}

@Injectable()
export class UnitsService {
  private readonly logger = new Logger(UnitsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  /**
   * Atomic, optimistic-concurrency-safe status transition (02-architecture.md §3, FR-42).
   *
   * The row is locked and `statusVersion` is incremented in the SAME UPDATE statement,
   * guarded by `status_version = expectedVersion`. Because the guard is part of the SQL,
   * two concurrent requests cannot both succeed: the loser matches zero rows and the
   * transaction returns the current row so we can build the 409 response.
   */
  async transitionStatus(
    unitId: string,
    status: UnitStatus,
    expectedVersion: number,
    actorId?: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.$executeRaw`
        UPDATE "Unit"
        SET "status" = ${status}::"UnitStatus",
            "statusVersion" = "statusVersion" + 1,
            "updatedAt" = now()
        WHERE id = ${unitId} AND "statusVersion" = ${expectedVersion}
        RETURNING id, status, "statusVersion", "holdExpiresAt"
      `;

      if (updated === 0) {
        // Conflict — fetch current truth for the 409 body.
        const current = await tx.unit.findUnique({
          where: { id: unitId },
          select: { id: true, status: true, statusVersion: true, holdExpiresAt: true },
        });
        if (!current) throw new NotFoundException("Unit not found");
        throw new UnitStatusConflictError({
          unitId: current.id,
          status: current.status,
          statusVersion: current.statusVersion,
          holdExpiresAt: current.holdExpiresAt,
        });
      }

      const unit = await tx.unit.findUnique({ where: { id: unitId } });
      if (!unit) throw new NotFoundException("Unit not found");

      // Full auditability (02-architecture.md §3 rule 4).
      await tx.auditLog.create({
        data: {
          userId: actorId ?? null,
          action: "update_status",
          entity: "Unit",
          entityId: unitId,
        },
      });

      return unit;
    });

    // Event-driven notification (runs out-of-band; alerts on sold status per FR-58).
    if (status === UnitStatus.sold) {
      await this.events.unitStatusChanged(unitId, status);
    }

    return {
      id: result.id,
      status: result.status,
      statusVersion: result.statusVersion,
      holdExpiresAt: result.holdExpiresAt,
    };
  }
}
