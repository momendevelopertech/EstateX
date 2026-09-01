import { Module } from "@nestjs/common";
import { GuestSessionsController } from "./guest-sessions.controller";

@Module({ controllers: [GuestSessionsController] })
export class GuestSessionsModule {}
