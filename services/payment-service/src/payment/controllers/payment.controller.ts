import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Request,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { RefundService } from '../services/refund.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { RequestRefundDto } from '@/payment/dto/request-refund.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller("payments")
export class PaymentController {
	constructor(
		private readonly paymentService: PaymentService,
		private readonly refundService: RefundService,
	) {}

	/**
	 * Create a payment for a job
	 * POST /payments
	 */
	@Post()
	@UseGuards(JwtAuthGuard)
	async createPayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req: any) {
		const payment = await this.paymentService.createPayment(
			createPaymentDto.job_id,
			createPaymentDto.amount,
			createPaymentDto.currency,
			req.user.id, // user_id from authenticated user
			createPaymentDto.provider_id,
			createPaymentDto.coupon_code,
		);

		return { success: true, data: payment, message: "Payment created successfully" };
	}

	/**
	 * Get payment by ID
	 * GET /payments/:id
	 */
	@Get(":id")
	@UseGuards(JwtAuthGuard)
	async getPaymentById(@Param("id", ParseUUIDPipe) id: string) {
		const payment = await this.paymentService.getPaymentById(id);

		return { success: true, data: payment };
	}

	/**
	 * Get current user's payments (customer view)
	 * GET /payments/my
	 */
	@Get("my")
	@UseGuards(JwtAuthGuard)
	async getMyPayments(@Request() req: any, @Query("page") page: number = 1, @Query("limit") limit: number = 20) {
		const payments = await this.paymentService.getPaymentsByUser(req.user.id);

		// Apply pagination
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedPayments = payments.slice(startIndex, endIndex);

		return {
			success: true,
			data: paginatedPayments,
			total: payments.length,
			page: Number(page),
			limit: Number(limit),
			hasMore: endIndex < payments.length,
		};
	}

	/**
	 * Get payments for a specific job
	 * GET /jobs/:jobId/payments
	 */
	@Get("jobs/:jobId")
	@UseGuards(JwtAuthGuard)
	async getPaymentsByJob(@Param("jobId", ParseUUIDPipe) jobId: string) {
		const payments = await this.paymentService.getPaymentsByJobId(jobId);

		return { success: true, data: payments };
	}

	/**
	 * Get payment status
	 * GET /payments/:id/status
	 */
	@Get(":id/status")
	@UseGuards(JwtAuthGuard)
	async getPaymentStatus(@Param("id", ParseUUIDPipe) id: string) {
		const payment = await this.paymentService.getPaymentById(id);

		return {
			success: true,
			data: {
				id: payment.id,
				status: payment.status,
				amount: payment.amount,
				currency: payment.currency,
				transaction_id: payment.transaction_id,
				created_at: payment.created_at,
				paid_at: payment.paid_at,
			},
		};
	}

	/**
	 * Request a refund
	 * POST /payments/:id/refund
	 */
	@Post(":id/refund")
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	async requestRefund(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() requestRefundDto: RequestRefundDto,
		@Request() req: any,
	) {
		const refund = await this.refundService.createRefund(id, requestRefundDto.amount);

		return { success: true, data: refund, message: "Refund request submitted successfully" };
	}

	/**
	 * Get provider earnings summary
	 * GET /payments/provider/:providerId/summary
	 */
	@Get("provider/:providerId/summary")
	@UseGuards(JwtAuthGuard)
	async getProviderEarningsSummary(
		@Param("providerId", ParseUUIDPipe) providerId: string,
		@Query("start_date") startDate?: string,
		@Query("end_date") endDate?: string,
	) {
		const start = startDate ? new Date(startDate) : undefined;
		const end = endDate ? new Date(endDate) : undefined;

		const earnings = await this.paymentService.getProviderEarnings(providerId, start, end);

		return { success: true, data: earnings };
	}

	/**
	 * Get provider transaction list
	 * GET /payments/provider/:providerId/transactions
	 */
	@Get("provider/:providerId/transactions")
	@UseGuards(JwtAuthGuard)
	async getProviderTransactions(
		@Param("providerId", ParseUUIDPipe) providerId: string,
		@Query("page") page: number = 1,
		@Query("limit") limit: number = 20,
		@Query("status") status?: string,
		@Query("cursor") cursor?: string,
	) {
		const transactions = await this.paymentService.getProviderTransactions(providerId, limit, cursor, status);

		return { success: true, ...transactions };
	}
}
