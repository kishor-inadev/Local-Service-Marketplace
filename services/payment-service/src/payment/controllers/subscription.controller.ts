import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Request,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from "@nestjs/common";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "@/common/pipes/strict-uuid.pipe";
import { SubscriptionService } from "../services/subscription.service";
import { CreateSubscriptionDto } from "../dto/create-subscription.dto";
import { UpgradeSubscriptionDto } from "../dto/upgrade-subscription.dto";
import { SubscriptionQueryDto } from "../dto/transaction-query.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { PermissionsGuard as RolesGuard, Roles, RequirePermissions } from '@/common/rbac';

@UseGuards(JwtAuthGuard)
@Controller("subscriptions")
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  private assertProviderAccess(req: any, providerId: string) {
    if (!req.user.permissions?.includes('subscriptions.manage') && req.user.providerId !== providerId) {
      throw new ForbiddenException("You can only manage subscriptions for your own provider account");
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSubscription(
    @Body() data: CreateSubscriptionDto,
    @Request() req: any,
  ) {
    this.assertProviderAccess(req, data.provider_id);

    const subscription = await this.subscriptionService.createSubscription(
      data.provider_id,
      data.plan_id,
      req.user.userId,
      req.user.role,
      req.user.providerId,
    );

    return {
      success: true,
      data: subscription,
      message: "Subscription created. Pending payment confirmation.",
    };
  }

  @RequirePermissions('subscriptions.manage')
  @UseGuards(RolesGuard)
  @Post(":subscriptionId/activate")
  @HttpCode(HttpStatus.OK)
  async activateSubscription(
    @Param("subscriptionId", StrictUuidPipe) subscriptionId: string,
    @Request() req: any,
  ) {
    // Called after successful payment
    const subscription =
      await this.subscriptionService.activateSubscription(subscriptionId);

    return {
      success: true,
      data: subscription,
      message: "Subscription activated successfully",
    };
  }

  @Get("provider/:providerId")
  async getProviderSubscriptions(
    @Param("providerId", FlexibleIdPipe) providerId: string,
    @Request() req: any,
    @Query() queryDto: SubscriptionQueryDto,
  ) {
    this.assertProviderAccess(req, providerId);

    return this.subscriptionService.getProviderSubscriptionsPaginated(
      providerId,
      queryDto,
    );
  }

  @Get("provider/:providerId/active")
  async getActiveSubscription(
    @Param("providerId", FlexibleIdPipe) providerId: string,
    @Request() req: any,
  ) {
    this.assertProviderAccess(req, providerId);

    const subscription =
      await this.subscriptionService.getActiveSubscription(providerId);

    return {
      success: true,
      data: subscription,
      message: "Active subscription retrieved successfully",
    };
  }

  @Put(":subscriptionId/cancel")
  async cancelSubscription(
    @Param("subscriptionId", StrictUuidPipe) subscriptionId: string,
    @Request() req: any,
  ) {
    const subscription = await this.subscriptionService.cancelSubscription(
      subscriptionId,
      req.user.userId,
      req.user.role,
      req.user.providerId,
    );

    return {
      success: true,
      data: subscription,
      message: "Subscription cancelled. Will remain active until expiry date.",
    };
  }

  @Post("provider/:providerId/upgrade")
  @HttpCode(HttpStatus.OK)
  async upgradeSubscription(
    @Param("providerId", StrictUuidPipe) providerId: string,
    @Body() upgradeData: UpgradeSubscriptionDto,
    @Request() req: any,
  ) {
    this.assertProviderAccess(req, providerId);

    const subscription = await this.subscriptionService.upgradeSubscription(
      providerId,
      upgradeData.new_plan_id,
      req.user.userId,
      req.user.role,
      req.user.providerId,
    );

    return {
      success: true,
      data: subscription,
      message: "Subscription upgrade initiated. Pending payment.",
    };
  }

  @RequirePermissions('subscriptions.manage')
  @UseGuards(RolesGuard)
  @Get("expiring")
  async getExpiringSubscriptions(
    @Request() req: any,
    @Query() queryDto: SubscriptionQueryDto,
  ) {
    return this.subscriptionService.getExpiringSubscriptionsPaginated(queryDto);
  }

  @Get("provider/:providerId/status")
  async checkSubscriptionStatus(
    @Param("providerId", FlexibleIdPipe) providerId: string,
    @Request() req: any,
  ) {
    this.assertProviderAccess(req, providerId);

    const hasActive =
      await this.subscriptionService.checkProviderHasActiveSubscription(
        providerId,
      );

    return {
      success: true,
      data: { provider_id: providerId, has_active_subscription: hasActive },
    };
  }
}
