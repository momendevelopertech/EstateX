import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  NotificationStatus,
  NotificationType,
  NotificationChannel,
  UnitStatus,
} from "@prisma/client";

/**
 * Event-driven notification dispatcher (02-architecture.md §Notification Service layer).
 *
 * Business logic does NOT call a mailer/SMS client directly. It emits domain events here;
 * the dispatcher persists a Notification row and hands the payload to channel adapters.
 * In Phase 1 the adapters log (and could enqueue to Redis/BullMQ); the seam between
 * in-process dispatch and a real queue is a single interface, so swapping later (R10)
 * won't change callers.
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async newLead(leadId: string, assignedAgentId: string | null) {
    await this.dispatch({
      type: NotificationType.new_lead,
      relatedEntity: "Lead",
      relatedEntityId: leadId,
      payload: { leadId },
      recipients: assignedAgentId ? await this.recipientUserIdsForAgent(assignedAgentId) : [],
    });
  }

  async unitStatusChanged(unitId: string, status: UnitStatus) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { floor: { include: { building: true } } },
    });
    await this.dispatch({
      type: NotificationType.status_change,
      relatedEntity: "Unit",
      relatedEntityId: unitId,
      payload: {
        unitId,
        unitNumber: unit?.unitNumber ?? unitId,
        status,
        message: `Unit ${unit?.unitNumber ?? unitId} is now ${status}`,
      },
      // Notify admins/managers on sold (FR-58). Resolve via role in a real deployment.
      recipients: await this.adminUserIds(),
    });
  }

  async importCompleted(summary: { imported: number; failed: number }) {
    await this.dispatch({
      type: NotificationType.import_result,
      relatedEntity: "import",
      payload: summary,
      recipients: await this.adminUserIds(),
    });
  }

  async bookingConfirmed(bookingId: string, recipientContact?: { email?: string }) {
    await this.dispatch({
      type: NotificationType.booking_confirmation,
      relatedEntity: "Booking",
      relatedEntityId: bookingId,
      payload: { bookingId, confirmation: true },
      recipients: [],
      contacts: recipientContact?.email ? [{ email: recipientContact.email }] : [],
    });
  }

  private async recipientUserIdsForAgent(agentId: string): Promise<string[]> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });
    return agent?.user ? [agent.user.id] : [];
  }

  private async adminUserIds(): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: { role: { name: { in: ["Admin", "Super Admin", "Sales Manager"] } } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private async dispatch(opts: {
    type: NotificationType;
    relatedEntity?: string;
    relatedEntityId?: string;
    payload?: any;
    recipients: string[];
    contacts?: { email?: string }[];
  }) {
    const rows: Array<{
      recipientUserId: string | null;
      recipientContact?: any;
      type: NotificationType;
      channel: NotificationChannel;
      payload: any;
      status: NotificationStatus;
      relatedEntity: string | null;
      relatedEntityId: string | null;
      sentAt?: Date;
    }> = [];

    for (const userId of opts.recipients) {
      rows.push({
        recipientUserId: userId,
        type: opts.type,
        channel: NotificationChannel.in_app,
        payload: opts.payload ?? {},
        status: NotificationStatus.sent,
        relatedEntity: opts.relatedEntity ?? null,
        relatedEntityId: opts.relatedEntityId ?? null,
        sentAt: new Date(),
      });
    }
    // Non-registered recipients via recipientContact
    for (const c of opts.contacts ?? []) {
      if (c.email) {
        rows.push({
          recipientUserId: null,
          recipientContact: { email: c.email },
          type: opts.type,
          channel: NotificationChannel.email,
          payload: opts.payload ?? {},
          status: NotificationStatus.pending,
          relatedEntity: opts.relatedEntity ?? null,
          relatedEntityId: opts.relatedEntityId ?? null,
        });
      }
    }
    if (rows.length) {
      await this.prisma.notification.createMany({ data: rows });
    }
    // Channel adapter seam (email/SMS/WhatsApp). Phase 1: log-only.
    for (const r of rows) {
      this.logger.log(
        `[notification] type=${opts.type} channel=${r.channel} related=${opts.relatedEntity}/${opts.relatedEntityId}`,
      );
    }
  }
}
