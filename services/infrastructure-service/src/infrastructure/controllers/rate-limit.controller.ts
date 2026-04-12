import { Controller, Post, Delete, Body, Param, Inject, LoggerService, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard as RolesGuard, Roles, RequirePermissions } from '@/common/rbac';
import { RateLimitService } from '../services/rate-limit.service';
import { CheckRateLimitDto } from '../dto/check-rate-limit.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@RequirePermissions('admin.access')
@Controller('rate-limits')
export class RateLimitController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
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

    return { message: "Rate limit reset successfully" };
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  async cleanupExpiredLimits() {
    this.logger.log(
      'POST /rate-limits/cleanup - Cleanup expired rate limits',
      'RateLimitController',
    );

    await this.rateLimitService.cleanupExpiredLimits();

    return { message: "Expired rate limits cleaned up successfully" };
  }
}
