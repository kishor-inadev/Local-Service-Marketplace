import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { CouponRepository } from '../repositories/coupon.repository';
import { Coupon } from '../entities/coupon.entity';
import { NotFoundException, BadRequestException } from '../../common/exceptions/http.exceptions';

@Injectable()
export class CouponService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly couponRepository: CouponRepository,
  ) {}

  async validateCoupon(code: string): Promise<Coupon> {
    this.logger.log(`Validating coupon ${code}`, 'CouponService');

    const coupon = await this.couponRepository.getCouponByCode(code);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Check if coupon is expired
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    return coupon;
  }

  async validateAndUseCoupon(code: string, userId: string): Promise<number> {
    const coupon = await this.validateCoupon(code);

    // Check if user has already used this coupon
    const alreadyUsed = await this.couponRepository.isCouponUsedByUser(coupon.id, userId);
    if (alreadyUsed) {
      throw new BadRequestException('Coupon has already been used');
    }

    // Record coupon usage
    await this.couponRepository.recordCouponUsage(coupon.id, userId);

    this.logger.log(`Coupon ${code} applied for user ${userId}`, 'CouponService');
    return coupon.discountPercent;
  }

  async getCouponByCode(code: string): Promise<Coupon> {
    return this.validateCoupon(code);
  }
}
