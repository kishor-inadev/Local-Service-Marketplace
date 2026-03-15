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
  UseGuards
} from '@nestjs/common';
import { PricingPlanService } from '../services/pricing-plan.service';
import { CreatePricingPlanDto } from '../dto/create-pricing-plan.dto';
import { UpdatePricingPlanDto } from '../dto/update-pricing-plan.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('pricing-plans')
export class PricingPlanController {
  constructor(
    private readonly pricingPlanService: PricingPlanService
  ) {}

  @Post()
  async createPlan(
    @Body() planData: CreatePricingPlanDto,
    @Request() req: any
  ) {
    // TODO: Add admin guard
    const plan = await this.pricingPlanService.createPlan(planData);

    return {
      success: true,
      data: plan,
      message: 'Pricing plan created successfully'
    };
  }

  @Get()
  async getAllPlans(
    @Query('active_only') activeOnly?: string
  ) {
    const plans = await this.pricingPlanService.getAllPlans(
      activeOnly !== 'false'
    );

    return {
      success: true,
      data: plans,
      count: plans.length
    };
  }

  @Get('active')
  async getActivePlans() {
    const plans = await this.pricingPlanService.getActivePlans();

    return {
      success: true,
      data: plans,
      count: plans.length
    };
  }

  @Get('compare')
  async comparePlans() {
    const comparison = await this.pricingPlanService.comparePlans();

    return {
      success: true,
      data: comparison
    };
  }

  @Get(':planId')
  async getPlanById(@Param('planId', ParseUUIDPipe) planId: string) {
    const plan = await this.pricingPlanService.getPlanById(planId);

    return {
      success: true,
      data: plan
    };
  }

  @Put(':planId')
  async updatePlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() updateData: UpdatePricingPlanDto,
    @Request() req: any
  ) {
    // TODO: Add admin guard
    const plan = await this.pricingPlanService.updatePlan(planId, updateData);

    return {
      success: true,
      data: plan,
      message: 'Pricing plan updated successfully'
    };
  }

  @Put(':planId/deactivate')
  async deactivatePlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Request() req: any
  ) {
    // TODO: Add admin guard
    const plan = await this.pricingPlanService.deactivatePlan(planId);

    return {
      success: true,
      data: plan,
      message: 'Pricing plan deactivated'
    };
  }
}
