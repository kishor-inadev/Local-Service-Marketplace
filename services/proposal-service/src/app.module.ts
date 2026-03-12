import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from './common/logger/logger.module';
import { DatabaseModule } from './common/database/database.module';
import { KafkaModule } from './kafka/kafka.module';
import { ProposalModule } from './modules/proposal/proposal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    DatabaseModule,
    KafkaModule,
    ProposalModule,
  ],
})
export class AppModule {}
