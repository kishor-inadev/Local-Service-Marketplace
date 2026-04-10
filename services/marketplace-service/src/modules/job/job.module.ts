import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { BullModule } from "@nestjs/bullmq";
import { JobController } from "./controllers/job.controller";
import { JobService } from "./services/job.service";
import { JobRepository } from "./repositories/job.repository";
import { DatabaseModule } from "../../common/database/database.module";
import { NotificationModule } from "../../common/notification/notification.module";
import { UserModule } from "../../common/user/user.module";
import { AnalyticsModule } from "../../common/analytics/analytics.module";
import { FileServiceClient } from "../../common/file-service.client";

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'marketplace.notification' },
      { name: 'marketplace.analytics' },
    ),
    DatabaseModule,
    NotificationModule,
    UserModule,
    AnalyticsModule,
    HttpModule.register({
      timeout: Number(process.env.REQUEST_TIMEOUT_MS) || 72000,
      maxRedirects: 5,
    }),
  ],
  controllers: [JobController],
  providers: [JobService, JobRepository, FileServiceClient],
  exports: [JobService, FileServiceClient],
})
export class JobModule {}
