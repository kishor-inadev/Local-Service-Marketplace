import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Request,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "@/common/pipes/strict-uuid.pipe";
import { RefundService } from "../services/refund.service";
import { RefundRepository } from "../repositories/refund.repository";
import { PaymentRepository } from "../repositories/payment.repository";
import { RequestRefundDto } from "../dto/request-refund.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { ForbiddenException, NotFoundException } from "@/common/exceptions/http.exceptions";

@Controller("refunds")
export class RefundController {
  constructor(
    private readonly refundService: RefundService,
    private readonly refundRepository: RefundRepository,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  /**
   * Create a refund for a payment
   * POST /refunds/:paymentId
   */
  @Post(":paymentId")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createRefund(
    @Param("paymentId", StrictUuidPipe) paymentId: string,
    @Body() requestRefundDto: RequestRefundDto,
    @Request() req: any,
  ) {
    // Ownership validation - ensure user owns the payment
    const payment = await this.paymentRepository.getPaymentById(paymentId);
    
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }
    
    // Only the payment owner or admin can request refunds
    if (payment.user_id !== req.user.userId && req.user.role !== "admin") {
      throw new ForbiddenException(
        "You do not have permission to request a refund for this payment"
      );
    }
    
    const refund = await this.refundService.createRefund(
      paymentId,
      requestRefundDto.amount,
    );

    return {
      success: true,
      message: "Refund request created successfully",
      data: refund,
    };
  }

  /**
   * Get refund by ID
   * GET /refunds/:id
   */
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getRefundById(
    @Param("id", FlexibleIdPipe) id: string,
    @Request() req: any,
  ) {
    const refund = await this.refundService.getRefundById(id);

    // Ownership validation - ensure user owns the payment
    const payment = await this.paymentRepository.getPaymentById(refund.payment_id);
    
    // Only the payment owner or admin can view refund details
    if (payment.user_id !== req.user.userId && req.user.role !== "admin") {
      throw new ForbiddenException(
        "You do not have permission to view this refund"
      );
    }

    return {
      success: true,
      data: refund,
    };
  }

  /**
   * Get refunds for a specific payment
   * GET /refunds/payment/:paymentId
   */
  @Get("payment/:paymentId")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getRefundsByPayment(
    @Param("paymentId", FlexibleIdPipe) paymentId: string,
    @Request() req: any,
  ) {
    // Ownership validation - ensure user owns the payment
    const payment = await this.paymentRepository.getPaymentById(paymentId);
    
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }
    
    // Only the payment owner or admin can view refunds for a payment
    if (payment.user_id !== req.user.userId && req.user.role !== "admin") {
      throw new ForbiddenException(
        "You do not have permission to view refunds for this payment"
      );
    }
    
    const refunds = await this.refundService.getRefundsByPaymentId(paymentId);

    return {
      success: true,
      data: refunds,
      total: refunds.length,
    };
  }

  /**
   * Admin only - List all refunds (with pagination in future)
   * GET /refunds
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  async getAllRefunds(
    @Query("limit") limit: string = "50",
    @Query("offset") offset: string = "0",
  ) {
    const { refunds, total } = await this.refundRepository.getAllRefunds(
      parseInt(limit, 10),
      parseInt(offset, 10),
    );
    return {
      success: true,
      message: "Refund list retrieved successfully",
      data: refunds,
      total,
    };
  }
}
