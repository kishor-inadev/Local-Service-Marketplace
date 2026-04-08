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
  HttpStatus,
} from "@nestjs/common";
import { PricingPlanService } from "../services/pricing-plan.service";
import { CreatePricingPlanDto } from "../dto/create-pricing-plan.dto";
import { UpdatePricingPlanDto } from "../dto/update-pricing-plan.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";

@Controller("pricing-plans")
export class PricingPlanController {
  constructor(private readonly pricingPlanService: PricingPlanService) {}

  @Roles("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPlan(
    @Body() planData: CreatePricingPlanDto,
    @Request() req: any,
  ) {
    const plan = await this.pricingPlanService.createPlan(planData);

    return {
      success: true,
      data: plan,
      message: "Pricing plan created successfully",
    };
  }

  @Get()
  async getAllPlans(@Query("active_only") activeOnly?: string) {
    const plans = await this.pricingPlanService.getAllPlans(
      activeOnly !== "false",
    );

    return {
      data: plans,
      total: plans.length,
      page: 1,
      limit: plans.length || 1,
    };
  }

  @Get("active")
  async getActivePlans() {
    const plans = await this.pricingPlanService.getActivePlans();

    return {
      data: plans,
      total: plans.length,
      page: 1,
      limit: plans.length || 1,
    };
  }

  @Get("compare")
  async comparePlans() {
    const comparison = await this.pricingPlanService.comparePlans();

    return {
      success: true,
      data: comparison,
      message: "Pricing plan comparison retrieved successfully",
    };
  }

  @Get(":planId")
  async getPlanById(@Param("planId", ParseUUIDPipe) planId: string) {
    const plan = await this.pricingPlanService.getPlanById(planId);

    return {
      success: true,
      data: plan,
      message: "Pricing plan retrieved successfully",
    };
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(":planId")
  async updatePlan(
    @Param("planId", ParseUUIDPipe) planId: string,
    @Body() updateData: UpdatePricingPlanDto,
    @Request() req: any,
  ) {
    const plan = await this.pricingPlanService.updatePlan(planId, updateData);

    return {
      success: true,
      data: plan,
      message: "Pricing plan updated successfully",
    };
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(":planId/deactivate")
  async deactivatePlan(
    @Param("planId", ParseUUIDPipe) planId: string,
    @Request() req: any,
  ) {
    const plan = await this.pricingPlanService.deactivatePlan(planId);

    return {
      success: true,
      data: plan,
      message: "Pricing plan deactivated",
    };
  }
}
