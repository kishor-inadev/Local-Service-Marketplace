import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { StrictUuidPipe } from "@/common/pipes/strict-uuid.pipe";
import { CouponService } from "../services/coupon.service";
import { CouponRepository } from "../repositories/coupon.repository";
import { CreateCouponDto } from "../dto/create-coupon.dto";
import { ValidateCouponDto } from "../dto/validate-coupon.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { PermissionsGuard as RolesGuard, Roles, RequirePermissions } from '@/common/rbac';

@Controller("coupons")
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
    private readonly couponRepository: CouponRepository,
  ) {}

  /**
   * Admin only - Create a new coupon
   * POST /coupons
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('coupons.manage')
  @HttpCode(HttpStatus.CREATED)
  async createCoupon(
    @Body() createCouponDto: CreateCouponDto,
    @Request() req: any,
  ) {
    // Set the creator to the current admin user
    const couponData = {
      ...createCouponDto,
      expires_at: new Date(createCouponDto.expires_at),
      created_by: req.user.userId,
    };

    const coupon = await this.couponRepository.createCoupon(couponData);

    return {
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    };
  }

  /**
   * Admin only - Get all active coupons
   * GET /coupons
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('coupons.manage')
  @HttpCode(HttpStatus.OK)
  async getAllCoupons() {
    const coupons = await this.couponRepository.getActiveCoupons();

    return {
      success: true,
      data: coupons,
      total: coupons.length,
    };
  }

  /**
   * Get coupon by code (public or authenticated)
   * GET /coupons/:code
   */
  @Get(":code")
  @HttpCode(HttpStatus.OK)
  async getCouponByCode(@Param("code") code: string) {
    const coupon = await this.couponService.getCouponByCode(code);

    return {
      success: true,
      data: coupon,
    };
  }

  /**
   * Validate a coupon code
   * POST /coupons/:code/validate
   */
  @Post(":code/validate")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async validateCoupon(
    @Param("code") code: string,
    @Request() req: any,
  ) {
    const discountPercent = await this.couponService.validateAndUseCoupon(
      code,
      req.user.userId,
    );

    return {
      success: true,
      message: "Coupon validated and applied successfully",
      data: {
        code,
        discount_percent: discountPercent,
      },
    };
  }

  /**
   * Admin only - Get coupon statistics
   * GET /coupons/:couponId/stats
   */
  @Get(":couponId/stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('coupons.manage')
  @HttpCode(HttpStatus.OK)
  async getCouponStats(@Param("couponId", StrictUuidPipe) couponId: string) {
    const stats = await this.couponRepository.getCouponStats(couponId);

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Admin only - Delete/deactivate a coupon
   * DELETE /coupons/:code
   */
  @Delete(":code")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('coupons.manage')
  @HttpCode(HttpStatus.OK)
  async deleteCoupon(@Param("code") code: string) {
    const coupon = await this.couponService.getCouponByCode(code);
    await this.couponRepository.deactivateCoupon(coupon.id);
    return {
      success: true,
      message: `Coupon ${code} deactivated successfully`,
      data: { code, id: coupon.id },
    };
  }

  /**
   * Get coupon usage for current user
   * GET /coupons/usage/my
   */
  @Get("usage/my")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyCouponUsage(@Request() req: any) {
    const usages = await this.couponRepository.getCouponUsagesByUser(
      req.user.userId,
    );

    return {
      success: true,
      data: usages,
      total: usages.length,
    };
  }
}
