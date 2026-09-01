import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { EventsService } from "./events.service";

@Module({
  controllers: [NotificationsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class NotificationsModule {}
