import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Request,
  ParseUUIDPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { UpgradeSubscriptionDto } from '../dto/upgrade-subscription.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSubscription(
    @Body() data: CreateSubscriptionDto,
    @Request() req: any
  ) {
    const subscription = await this.subscriptionService.createSubscription(
      data.provider_id,
      data.plan_id,
      req.user.id
    );

    return {
      success: true,
      data: subscription,
      message: 'Subscription created. Pending payment confirmation.'
    };
  }

  @Post(':subscriptionId/activate')
  @HttpCode(HttpStatus.OK)
  async activateSubscription(
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Request() req: any
  ) {
    // Called after successful payment
    const subscription = await this.subscriptionService.activateSubscription(
      subscriptionId
    );

    return {
      success: true,
      data: subscription,
      message: 'Subscription activated successfully'
    };
  }

  @Get('provider/:providerId')
  async getProviderSubscriptions(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Request() req: any
  ) {
    const subscriptions = await this.subscriptionService.getProviderSubscriptions(
      providerId
    );

    return {
      success: true,
      data: subscriptions,
      count: subscriptions.length
    };
  }

  @Get('provider/:providerId/active')
  async getActiveSubscription(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Request() req: any
  ) {
    const subscription = await this.subscriptionService.getActiveSubscription(
      providerId
    );

    return {
      success: true,
      data: subscription,
      has_active: !!subscription
    };
  }

  @Put(':subscriptionId/cancel')
  async cancelSubscription(
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Request() req: any
  ) {
    const subscription = await this.subscriptionService.cancelSubscription(
      subscriptionId,
      req.user.id
    );

    return {
      success: true,
      data: subscription,
      message: 'Subscription cancelled. Will remain active until expiry date.'
    };
  }

  @Post('provider/:providerId/upgrade')
  @HttpCode(HttpStatus.OK)
  async upgradeSubscription(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Body() upgradeData: UpgradeSubscriptionDto,
    @Request() req: any
  ) {
    const subscription = await this.subscriptionService.upgradeSubscription(
      providerId,
      upgradeData.new_plan_id,
      req.user.id
    );

    return {
      success: true,
      data: subscription,
      message: 'Subscription upgrade initiated. Pending payment.'
    };
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Get('expiring')
  async getExpiringSubscriptions(
    @Request() req: any,
    @Query('days') days?: string
  ) {
    const daysAhead = days ? parseInt(days) : 7;
    const subscriptions = await this.subscriptionService.getExpiringSubscriptions(
      daysAhead
    );

    return {
      success: true,
      data: subscriptions,
      count: subscriptions.length
    };
  }

  @Get('provider/:providerId/status')
  async checkSubscriptionStatus(
    @Param('providerId', ParseUUIDPipe) providerId: string
  ) {
    const hasActive = await this.subscriptionService.checkProviderHasActiveSubscription(
      providerId
    );

    return {
      success: true,
      data: {
        provider_id: providerId,
        has_active_subscription: hasActive
      }
    };
  }
}
