import { Controller, Get, Patch, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthedRequestUser } from "../auth/roles.guard";

@Controller("notifications")
@UseGuards(AuthGuard("jwt"))
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async feed(@CurrentUser() user: AuthedRequestUser) {
    const notifications = await this.prisma.notification.findMany({
      where: { recipientUserId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unread = await this.prisma.notification.count({
      where: { recipientUserId: user.id, status: "sent" },
    });
    return { notifications, unread };
  }

  @Patch(":id/read")
  async markRead(@Param("id") id: string, @CurrentUser() user: AuthedRequestUser) {
    await this.prisma.notification.updateMany({
      where: { id, recipientUserId: user.id },
      data: { status: "sent" },
    });
    return { ok: true };
  }
}
