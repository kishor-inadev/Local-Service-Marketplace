import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Request,
  Headers,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "@/common/pipes/strict-uuid.pipe";
import { Response } from "express";
import { PaymentService } from "../services/payment.service";
import { RefundService } from "../services/refund.service";
import { InvoiceService } from "../services/invoice.service";
import { CreatePaymentDto } from "../dto/create-payment.dto";
import { RequestRefundDto } from "@/payment/dto/request-refund.dto";
import { TransactionQueryDto } from "../dto/transaction-query.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { ForbiddenException } from "@/common/exceptions/http.exceptions";

@Controller("payments")
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly refundService: RefundService,
    private readonly invoiceService: InvoiceService,
  ) {}

  /**
   * Create a payment for a job
   * POST /payments
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req: any,
    @Headers("x-payment-gateway") gatewayHeader?: string,
  ) {
    const payment = await this.paymentService.createPayment(
      createPaymentDto.job_id,
      createPaymentDto.amount,
      createPaymentDto.currency,
      req.user.userId, // user_id from authenticated user
      createPaymentDto.provider_id,
      createPaymentDto.coupon_code,
      gatewayHeader?.toLowerCase(),
    );

    return payment;
  }

  /**
   * Admin stats endpoint
   * GET /payments/stats
   */
  @Get("stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  async getPaymentStats() {
    return this.paymentService.getPaymentStats();
  }

  /**
   * Get payment by ID
   * GET /payments/:id
   */
  @Get("my")
  @UseGuards(JwtAuthGuard)
  async getMyPayments(
    @Request() req: any,
    @Query() queryDto: TransactionQueryDto,
  ) {
    return this.paymentService.getPaymentsByUserPaginated(
      req.user.userId,
      queryDto,
    );
  }

  @Get("jobs/:jobId")
  @UseGuards(JwtAuthGuard)
  async getPaymentsByJob(@Param("jobId", FlexibleIdPipe) jobId: string) {
    const payments = await this.paymentService.getPaymentsByJobId(jobId);
    return {
      data: payments,
      total: payments.length,
      page: 1,
      limit: payments.length || 1,
    };
  }

  @Get("provider/:providerId/summary")
  @UseGuards(JwtAuthGuard)
  async getProviderEarningsSummary(
    @Param("providerId", FlexibleIdPipe) providerId: string,
    @Request() req: any,
    @Query("start_date") startDate?: string,
    @Query("end_date") endDate?: string,
  ) {
    if (req.user.role !== "admin" && req.user.providerId !== providerId) {
      throw new ForbiddenException("Access denied");
    }
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const earnings = await this.paymentService.getProviderEarnings(
      providerId,
      start,
      end,
    );
    return earnings;
  }

  @Get("provider/:providerId/transactions")
  @UseGuards(JwtAuthGuard)
  async getProviderTransactions(
    @Param("providerId", FlexibleIdPipe) providerId: string,
    @Request() req: any,
    @Query() queryDto: TransactionQueryDto,
  ) {
    if (req.user.role !== "admin" && req.user.providerId !== providerId) {
      throw new ForbiddenException("Access denied");
    }
    return this.paymentService.getProviderTransactions(providerId, queryDto);
  }

  @Get("provider/:providerId/payouts")
  @UseGuards(JwtAuthGuard)
  async getProviderPayouts(
    @Param("providerId", FlexibleIdPipe) providerId: string,
    @Request() req: any,
  ) {
    if (req.user.role !== "admin" && req.user.providerId !== providerId) {
      throw new ForbiddenException("Access denied");
    }
    const payouts = await this.paymentService.getProviderPayouts(providerId);
    return {
      data: payouts,
      total: payouts.length,
      page: 1,
      limit: payouts.length || 1,
    };
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async getPaymentById(
    @Param("id", FlexibleIdPipe) id: string,
    @Request() req: any,
  ) {
    const payment = await this.paymentService.getPaymentById(id);
    if (
      req.user.role !== "admin" &&
      payment.user_id !== req.user.userId &&
      payment.provider_id !== req.user.userId
    ) {
      throw new ForbiddenException("Access denied");
    }
    return payment;
  }

  /**
   * Get current user's payments (customer view)
   * GET /payments/my
   */
  /**
   * Get payment status
   * GET /payments/:id/status
   */
  @Get(":id/status")
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(
    @Param("id", FlexibleIdPipe) id: string,
    @Request() req: any,
  ) {
    const payment = await this.paymentService.getPaymentById(id);
    if (
      req.user.role !== "admin" &&
      payment.user_id !== req.user.userId &&
      payment.provider_id !== req.user.userId
    ) {
      throw new ForbiddenException("Access denied");
    }

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      transaction_id: payment.transaction_id,
      created_at: payment.created_at,
      paid_at: payment.paid_at,
    };
  }

  /**
   * Request a refund
   * POST /payments/:id/refund
   */
  @Post(":id/refund")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async requestRefund(
    @Param("id", StrictUuidPipe) id: string,
    @Body() requestRefundDto: RequestRefundDto,
    @Request() req: any,
  ) {
    const payment = await this.paymentService.getPaymentById(id);
    if (req.user.role !== "admin" && payment.user_id !== req.user.userId) {
      throw new ForbiddenException(
        "Only the customer who made this payment can request a refund",
      );
    }
    const refund = await this.refundService.createRefund(
      id,
      requestRefundDto.amount,
    );

    return refund;
  }

  /**
   * Get provider earnings summary
   * GET /payments/provider/:providerId/summary
   */

  /**
   * Get invoice data (JSON)
   * GET /payments/:id/invoice
   */
  @Get(":id/invoice")
  @UseGuards(JwtAuthGuard)
  async getInvoice(
    @Param("id", FlexibleIdPipe) id: string,
    @Request() req: any,
  ) {
    const payment = await this.paymentService.getPaymentById(id);
    if (
      req.user.role !== "admin" &&
      payment.user_id !== req.user.userId &&
      payment.provider_id !== req.user.userId
    ) {
      throw new ForbiddenException("Access denied");
    }
    const invoice = await this.invoiceService.generateInvoice(
      id,
      req.user.userId,
    );
    return { success: true, message: "Invoice generated", data: invoice };
  }

  /**
   * Download invoice as HTML (printable)
   * GET /payments/:id/invoice/download
   */
  @Get(":id/invoice/download")
  @UseGuards(JwtAuthGuard)
  async downloadInvoice(
    @Param("id", FlexibleIdPipe) id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const payment = await this.paymentService.getPaymentById(id);
    if (
      req.user.role !== "admin" &&
      payment.user_id !== req.user.userId &&
      payment.provider_id !== req.user.userId
    ) {
      throw new ForbiddenException("Access denied");
    }
    const invoice = await this.invoiceService.generateInvoice(
      id,
      req.user.userId,
    );
    const html = this.invoiceService.generateInvoiceHtml(invoice);

    res.setHeader("Content-Type", "text/html");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${invoice.invoice_number}.html"`,
    );
    res.send(html);
  }
}
