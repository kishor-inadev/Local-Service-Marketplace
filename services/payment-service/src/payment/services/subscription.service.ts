import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { PricingPlanRepository } from "../repositories/pricing-plan.repository";
import { Subscription } from "../entities/subscription.entity";
import {
  SubscriptionQueryDto,
  SubscriptionSortBy,
  SortOrder,
} from "../dto/transaction-query.dto";
import { validateCursorMode } from "../../common/pagination/list-query-validation.util";

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly pricingPlanRepository: PricingPlanRepository,
  ) {}

  async createSubscription(
    providerId: string,
    planId: string,
    userId: string,
    actorRole?: string,
    actorProviderId?: string,
  ): Promise<Subscription> {
    if (actorRole !== "admin" && actorProviderId !== providerId) {
      throw new ForbiddenException("You can only create subscriptions for your own provider account");
    }
    const plan = await this.pricingPlanRepository.findById(planId);

    if (!plan) {
      throw new NotFoundException("Pricing plan not found");
    }

    if (!plan.active) {
      throw new BadRequestException("This pricing plan is no longer available");
    }

    // Check if provider already has an active subscription
    const activeSubscription =
      await this.subscriptionRepository.findActiveByProvider(providerId);

    if (activeSubscription) {
      throw new BadRequestException(
        "Provider already has an active subscription. Cancel or upgrade instead.",
      );
    }

    // Calculate expiry date based on billing period
    const startDate = new Date();
    const expiryDate = new Date(startDate);

    if (plan.billing_period === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (plan.billing_period === "yearly") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    // Create subscription in 'pending' status
    // Payment processing would happen separately and update status to 'active'
    const subscription = await this.subscriptionRepository.create({
      provider_id: providerId,
      plan_id: planId,
      status: "pending",
      started_at: startDate,
      expires_at: expiryDate,
    });

    return subscription;
  }

  async activateSubscription(subscriptionId: string): Promise<Subscription> {
    // Called after successful payment
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    if (subscription.status === "active") {
      throw new BadRequestException("Subscription is already active");
    }

    return this.subscriptionRepository.updateStatus(subscriptionId, "active");
  }

  async getProviderSubscriptions(providerId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.findByProvider(providerId);
  }

  async getProviderSubscriptionsPaginated(
    providerId: string,
    queryDto: SubscriptionQueryDto,
  ) {
    validateCursorMode(
      queryDto.cursor,
      queryDto.page,
      queryDto.sortBy,
      queryDto.sortOrder,
      SubscriptionSortBy.CREATED_AT,
      SortOrder.DESC,
    );

    const limit = queryDto.limit || 20;

    if (queryDto.cursor) {
      const subscriptions =
        await this.subscriptionRepository.findByProviderPaginated(
          providerId,
          queryDto,
        );
      const hasMore = subscriptions.length > limit;
      const data = subscriptions.slice(0, limit);
      const nextCursor =
        hasMore && data.length > 0
          ? data[data.length - 1].created_at
          : undefined;
      return { data, nextCursor, hasMore };
    }

    const [data, total] = await Promise.all([
      this.subscriptionRepository.findByProviderPaginated(providerId, queryDto),
      this.subscriptionRepository.countByProvider(providerId, queryDto),
    ]);
    return { data, total, page: queryDto.page || 1, limit };
  }

  async getActiveSubscription(
    providerId: string,
  ): Promise<Subscription | null> {
    return this.subscriptionRepository.findActiveByProvider(providerId);
  }

  async cancelSubscription(
    subscriptionId: string,
    userId: string,
    actorRole?: string,
    actorProviderId?: string,
  ): Promise<Subscription> {
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    if (actorRole !== "admin" && actorProviderId !== subscription.provider_id) {
      throw new ForbiddenException("You can only cancel your own provider subscription");
    }
      throw new BadRequestException("Subscription is already cancelled");
    }

    if (subscription.status === "expired") {
      throw new BadRequestException("Cannot cancel an expired subscription");
    }

    // Cancel subscription (remains active until expiry date)
    return this.subscriptionRepository.cancel(subscriptionId);
  }

  async upgradeSubscription(
    providerId: string,
    newPlanId: string,
    userId: string,
    actorRole?: string,
    actorProviderId?: string,
  ): Promise<Subscription> {
    if (actorRole !== "admin" && actorProviderId !== providerId) {
      throw new ForbiddenException("You can only upgrade your own provider subscription");
    }

    // Get current subscription
    const currentSubscription =
      await this.subscriptionRepository.findActiveByProvider(providerId);

    if (!currentSubscription) {
      throw new BadRequestException(
        "No active subscription found. Create a new subscription instead.",
      );
    }

    // Get new plan
    const newPlan = await this.pricingPlanRepository.findById(newPlanId);

    if (!newPlan || !newPlan.active) {
      throw new NotFoundException("New pricing plan not found or inactive");
    }

    // Get current plan for comparison
    const currentPlan = await this.pricingPlanRepository.findById(
      currentSubscription.plan_id,
    );

    if (!currentPlan) {
      throw new NotFoundException("Current pricing plan not found");
    }

    // Validate upgrade (new plan should be more expensive or different period)
    if (
      newPlan.price <= currentPlan.price &&
      newPlan.billing_period === currentPlan.billing_period
    ) {
      throw new BadRequestException(
        "New plan must be an upgrade (higher price or different period)",
      );
    }

    // Cancel current subscription
    await this.subscriptionRepository.cancel(currentSubscription.id);

    // Create new subscription
    const startDate = new Date();
    const expiryDate = new Date(startDate);

    if (newPlan.billing_period === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    return this.subscriptionRepository.create({
      provider_id: providerId,
      plan_id: newPlanId,
      status: "pending", // Requires payment
      started_at: startDate,
      expires_at: expiryDate,
    });
  }

  async getExpiringSubscriptions(days: number = 7): Promise<Subscription[]> {
    // Admin/system use - for sending renewal reminders
    return this.subscriptionRepository.getExpiringSubscriptions(days);
  }

  async getExpiringSubscriptionsPaginated(queryDto: SubscriptionQueryDto) {
    const days = queryDto.days || 7;
    const limit = queryDto.limit || 20;
    const [data, total] = await Promise.all([
      this.subscriptionRepository.getExpiringSubscriptionsPaginated(
        days,
        queryDto,
      ),
      this.subscriptionRepository.countExpiringSubscriptions(days, queryDto),
    ]);
    return { data, total, page: queryDto.page || 1, limit };
  }

  async expireOldSubscriptions(): Promise<number> {
    // Background job - run daily to expire old subscriptions
    return this.subscriptionRepository.expireOldSubscriptions();
  }

  async checkProviderHasActiveSubscription(
    providerId: string,
  ): Promise<boolean> {
    const subscription =
      await this.subscriptionRepository.findActiveByProvider(providerId);
    return !!subscription;
  }
}
