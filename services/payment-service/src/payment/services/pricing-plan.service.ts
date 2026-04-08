import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PricingPlanRepository } from "../repositories/pricing-plan.repository";
import { PricingPlan } from "../entities/pricing-plan.entity";

@Injectable()
export class PricingPlanService {
  constructor(private readonly pricingPlanRepository: PricingPlanRepository) {}

  async createPlan(data: {
    name: string;
    description?: string;
    price: number;
    billing_period: "monthly" | "yearly";
    features?: any;
    active?: boolean;
  }): Promise<PricingPlan> {
    // Admin only - authorization should be handled at controller level

    if (data.price < 0) {
      throw new BadRequestException("Price cannot be negative");
    }

    // Validate features structure if provided
    if (data.features) {
      if (typeof data.features !== "object") {
        throw new BadRequestException("Features must be a valid JSON object");
      }
    }

    return this.pricingPlanRepository.create(data);
  }

  async getAllPlans(activeOnly: boolean = true): Promise<PricingPlan[]> {
    return this.pricingPlanRepository.findAll(activeOnly);
  }

  async getActivePlans(): Promise<PricingPlan[]> {
    return this.pricingPlanRepository.findAll(true);
  }

  async getPlanById(planId: string): Promise<PricingPlan> {
    const plan = await this.pricingPlanRepository.findById(planId);

    if (!plan) {
      throw new NotFoundException("Pricing plan not found");
    }

    return plan;
  }

  async updatePlan(
    planId: string,
    updateData: {
      name?: string;
      description?: string;
      price?: number;
      billing_period?: "monthly" | "yearly";
      features?: any;
      active?: boolean;
    },
  ): Promise<PricingPlan> {
    // Admin only
    const plan = await this.getPlanById(planId);

    if (updateData.price !== undefined && updateData.price < 0) {
      throw new BadRequestException("Price cannot be negative");
    }

    // When changing price, recommend creating new plan instead
    if (updateData.price !== undefined && updateData.price !== plan.price) {
      // Log warning: changing price affects existing subscriptions
      console.warn(
        `Price change for plan ${planId}: ${plan.price} -> ${updateData.price}. ` +
          "This may affect existing subscriptions.",
      );
    }

    return this.pricingPlanRepository.update(planId, updateData);
  }

  async deactivatePlan(planId: string): Promise<PricingPlan> {
    // Admin only
    const plan = await this.getPlanById(planId);

    if (!plan.active) {
      throw new BadRequestException("Plan is already inactive");
    }

    // Note: Deactivating a plan should not affect existing subscriptions
    // Only prevents new subscriptions to this plan

    return this.pricingPlanRepository.deactivate(planId);
  }

  async comparePlans(): Promise<{
    plans: PricingPlan[];
    comparison: any;
  }> {
    const activePlans = await this.getActivePlans();

    // Build feature comparison matrix
    const allFeatures = new Set<string>();
    activePlans.forEach((plan) => {
      if (plan.features) {
        Object.keys(plan.features).forEach((feature) =>
          allFeatures.add(feature),
        );
      }
    });

    const comparison = Array.from(allFeatures).map((feature) => {
      const featureRow = { feature };
      activePlans.forEach((plan) => {
        featureRow[plan.name] = plan.features?.[feature] ?? false;
      });
      return featureRow;
    });

    return {
      plans: activePlans,
      comparison,
    };
  }
}
