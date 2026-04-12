import { Module } from "@nestjs/common";
import { JobClient } from "./job.client";

@Module({
  providers: [JobClient],
  exports: [JobClient],
})
export class MarketplaceModule {}
