import { Module } from "@nestjs/common";
import { AnalyticsClient } from "./analytics.client";

@Module({
  providers: [AnalyticsClient],
  exports: [AnalyticsClient],
})
export class AnalyticsModule {}
