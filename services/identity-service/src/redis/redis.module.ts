import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheWarmingService } from './cache-warming.service';
import { UserModule } from '../modules/user/user.module';

@Global()
@Module({
  imports: [UserModule],
  providers: [RedisService, CacheWarmingService],
  exports: [RedisService],
})
export class RedisModule {}
