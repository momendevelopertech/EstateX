import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { RecommendationsController } from "./recommendations.controller";

@Module({
  controllers: [AnalyticsController, RecommendationsController],
})
export class AnalyticsModule {}
