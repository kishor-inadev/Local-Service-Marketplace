import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { SavedPaymentMethodRepository } from "../repositories/saved-payment-method.repository";
import { SavePaymentMethodDto } from "../dto/save-payment-method.dto";
import { SavedPaymentMethod } from "../entities/saved-payment-method.entity";

@Injectable()
export class SavedPaymentMethodService {
  constructor(
    private readonly paymentMethodRepository: SavedPaymentMethodRepository,
  ) {}

  /**
   * Save a new payment method (tokenized)
   * CRITICAL: Never store actual card numbers - only tokens from payment gateway
   */
  async savePaymentMethod(
    dto: SavePaymentMethodDto,
  ): Promise<SavedPaymentMethod> {
    // Validate gateway token
    if (!dto.gateway_payment_method_id) {
      throw new BadRequestException(
        "Payment method ID from gateway is required",
      );
    }

    // Additional validation for card details
    if (dto.payment_type === "card") {
      if (!dto.last_four || dto.last_four.length !== 4) {
        throw new BadRequestException("Invalid last four digits");
      }

      if (dto.expiry_month && (dto.expiry_month < 1 || dto.expiry_month > 12)) {
        throw new BadRequestException("Invalid expiry month");
      }

      if (dto.expiry_year) {
        const currentYear = new Date().getFullYear();
        if (
          dto.expiry_year < currentYear ||
          dto.expiry_year > currentYear + 20
        ) {
          throw new BadRequestException("Invalid expiry year");
        }
      }

      // Check if card is expired
      if (dto.expiry_month && dto.expiry_year) {
        const expiryDate = new Date(dto.expiry_year, dto.expiry_month - 1);
        if (expiryDate < new Date()) {
          throw new BadRequestException("Card is expired");
        }
      }
    }

    // Check if user already has 5+ payment methods (limit)
    const existingMethods = await this.paymentMethodRepository.findByUserId(
      dto.user_id,
    );
    if (existingMethods.length >= 5) {
      throw new BadRequestException(
        "Maximum 5 payment methods allowed. Please delete an existing method first.",
      );
    }

    return this.paymentMethodRepository.create(dto);
  }

  async getUserPaymentMethods(userId: string): Promise<SavedPaymentMethod[]> {
    return this.paymentMethodRepository.findByUserId(userId);
  }

  async getPaymentMethodById(
    methodId: string,
    userId: string,
  ): Promise<SavedPaymentMethod> {
    const method = await this.paymentMethodRepository.findById(methodId);

    if (!method) {
      throw new NotFoundException("Payment method not found");
    }

    // Authorization: verify user owns this payment method
    if (method.user_id !== userId) {
      throw new ForbiddenException(
        "You do not have permission to access this payment method",
      );
    }

    return method;
  }

  async getDefaultPaymentMethod(
    userId: string,
  ): Promise<SavedPaymentMethod | null> {
    return this.paymentMethodRepository.findDefaultByUserId(userId);
  }

  async setDefaultPaymentMethod(
    methodId: string,
    userId: string,
  ): Promise<SavedPaymentMethod> {
    const method = await this.getPaymentMethodById(methodId, userId);

    return this.paymentMethodRepository.setDefault(methodId, userId);
  }

  async deletePaymentMethod(methodId: string, userId: string): Promise<void> {
    const method = await this.getPaymentMethodById(methodId, userId);

    // If this is the default payment method, warn user or prevent deletion
    if (method.is_default) {
      const allMethods =
        await this.paymentMethodRepository.findByUserId(userId);
      if (allMethods.length > 1) {
        throw new BadRequestException(
          "Cannot delete default payment method. Set another method as default first.",
        );
      }
    }

    await this.paymentMethodRepository.delete(methodId, userId);
  }

  /**
   * Check for expiring cards (for notification system)
   */
  async getExpiringCards(
    userId: string,
    monthsAhead: number = 2,
  ): Promise<SavedPaymentMethod[]> {
    const methods = await this.paymentMethodRepository.findByUserId(userId);

    const currentDate = new Date();
    const checkDate = new Date();
    checkDate.setMonth(currentDate.getMonth() + monthsAhead);

    return methods.filter((method) => {
      if (
        method.payment_type !== "card" ||
        !method.expiry_month ||
        !method.expiry_year
      ) {
        return false;
      }

      const expiryDate = new Date(method.expiry_year, method.expiry_month - 1);
      return expiryDate <= checkDate && expiryDate > currentDate;
    });
  }
}
