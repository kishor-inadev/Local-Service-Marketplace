import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ProposalController } from "./controllers/proposal.controller";
import { ProposalService } from "./services/proposal.service";
import { ProposalRepository } from "./repositories/proposal.repository";
import { JobRepository } from "../job/repositories/job.repository";
import { RequestRepository } from "../request/repositories/request.repository";
import { DatabaseModule } from "../../common/database/database.module";
import { NotificationModule } from "../../common/notification/notification.module";
import { UserModule } from "../../common/user/user.module";

@Module({
  imports: [
    BullModule.registerQueue({ name: 'marketplace.notification' }),
    DatabaseModule,
    NotificationModule,
    UserModule,
  ],
  controllers: [ProposalController],
  providers: [ProposalService, ProposalRepository, JobRepository, RequestRepository],
  exports: [ProposalService],
})
export class ProposalModule {}
