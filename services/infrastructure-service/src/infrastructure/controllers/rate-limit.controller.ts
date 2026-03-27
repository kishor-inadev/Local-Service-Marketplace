import { Controller, Post, Delete, Body, Param, Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RateLimitService } from '../services/rate-limit.service';
import { CheckRateLimitDto } from '../dto/check-rate-limit.dto';

@Controller('rate-limits')
export class RateLimitController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  @Post('check')
  async checkRateLimit(@Body() checkRateLimitDto: CheckRateLimitDto) {
    this.logger.log(
      `POST /rate-limits/check - Check rate limit for key: ${checkRateLimitDto.key}`,
      'RateLimitController',
    );

    const result = await this.rateLimitService.checkRateLimit(
      checkRateLimitDto.key,
    );

    return result;
  }

  @Delete(':key')
  async resetRateLimit(@Param('key') key: string) {
    this.logger.log(
      `DELETE /rate-limits/${key} - Reset rate limit`,
      'RateLimitController',
    );

    await this.rateLimitService.resetRateLimit(key);

    return { result: "Rate limit reset successfully" };
  }

  @Post('cleanup')
  async cleanupExpiredLimits() {
    this.logger.log(
      'POST /rate-limits/cleanup - Cleanup expired rate limits',
      'RateLimitController',
    );

    await this.rateLimitService.cleanupExpiredLimits();

    return { result: "Expired rate limits cleaned up successfully" };
  }
}
