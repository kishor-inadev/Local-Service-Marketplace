import { Module, Global } from "@nestjs/common";
import Redis from "ioredis";
import { RedisService } from "./redis.service";
import { CacheWarmingService } from "./cache-warming.service";
import { UserModule } from "../modules/user/user.module";

const redisClientProvider = {
  provide: "REDIS_CLIENT",
  useFactory: (): Redis => {
    const client = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 5) return null; // stop retrying — fail gracefully
        return Math.min(times * 100, 2000);
      },
    });
    client.on("error", () => {}); // swallow connection errors (fail-open policy)
    return client;
  },
};

@Global()
@Module({
  imports: [UserModule],
  providers: [redisClientProvider, RedisService, CacheWarmingService],
  exports: ["REDIS_CLIENT", RedisService],
})
export class RedisModule {}
