import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";

import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ProjectsModule } from "./projects/projects.module";
import { BuildingsModule } from "./buildings/buildings.module";
import { UnitsModule } from "./units/units.module";
import { PaymentPlansModule } from "./payment-plans/payment-plans.module";
import { ToursModule } from "./tours/tours.module";
import { FavoritesModule } from "./favorites/favorites.module";
import { LeadsModule } from "./leads/leads.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { DevelopersModule } from "./developers/developers.module";
import { GuestSessionsModule } from "./guest-sessions/guest-sessions.module";
import { HealthModule } from "./health/health.module";
import { AuditModule } from "./audit/audit.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    BuildingsModule,
    UnitsModule,
    PaymentPlansModule,
    ToursModule,
    FavoritesModule,
    LeadsModule,
    AnalyticsModule,
    NotificationsModule,
    DevelopersModule,
    GuestSessionsModule,
    HealthModule,
    AuditModule,
    // Rate limit (04-api-spec.md §Errors/429) — 120 req/min per IP by default.
    ThrottlerModule.forRoot({ throttlers: [{ limit: 120, ttl: 60000 }] }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
