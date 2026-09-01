import { Module } from "@nestjs/common";
import { LeadsController } from "./leads.controller";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [LeadsController],
})
export class LeadsModule {}
