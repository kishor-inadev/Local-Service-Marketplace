import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheWarmingService } from './cache-warming.service';
import { RequestModule } from '../modules/request/request.module';

@Global()
@Module({
  imports: [RequestModule],
  providers: [RedisService, CacheWarmingService],
  exports: [RedisService],
})
export class RedisModule {}
