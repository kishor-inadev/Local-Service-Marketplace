import { Module } from '@nestjs/common';
import { ProposalController } from './controllers/proposal.controller';
import { ProposalService } from './services/proposal.service';
import { ProposalRepository } from './repositories/proposal.repository';
import { DatabaseModule } from '../../common/database/database.module';
import { NotificationModule } from '../../common/notification/notification.module';
import { UserModule } from '../../common/user/user.module';

@Module({
  imports: [DatabaseModule, NotificationModule, UserModule],
  controllers: [ProposalController],
  providers: [ProposalService, ProposalRepository],
  exports: [ProposalService],
})
export class ProposalModule {}
