import { Module } from '@nestjs/common';
import { JobController } from './controllers/job.controller';
import { JobService } from './services/job.service';
import { JobRepository } from './repositories/job.repository';
import { DatabaseModule } from '../../common/database/database.module';
import { NotificationModule } from '../../common/notification/notification.module';
import { UserModule } from '../../common/user/user.module';

@Module({
  imports: [DatabaseModule, NotificationModule, UserModule],
  controllers: [JobController],
  providers: [JobService, JobRepository],
  exports: [JobService],
})
export class JobModule {}
