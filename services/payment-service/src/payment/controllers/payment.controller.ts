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
import { TransactionQueryDto } from "../dto/transaction-query.dto";
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
	@HttpCode(HttpStatus.CREATED)
	async createPayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req: any) {
		const payment = await this.paymentService.createPayment(
			createPaymentDto.job_id,
			createPaymentDto.amount,
			createPaymentDto.currency,
			req.user.id, // user_id from authenticated user
			createPaymentDto.provider_id,
			createPaymentDto.coupon_code,
		);

		return payment;
	}

	/**
	 * Get payment by ID
	 * GET /payments/:id
	 */
	@Get("my")
	@UseGuards(JwtAuthGuard)
	async getMyPayments(@Request() req: any, @Query() queryDto: TransactionQueryDto) {
		return this.paymentService.getPaymentsByUserPaginated(req.user.id, queryDto);
	}

	@Get("jobs/:jobId")
	@UseGuards(JwtAuthGuard)
	async getPaymentsByJob(@Param("jobId", ParseUUIDPipe) jobId: string) {
		const payments = await this.paymentService.getPaymentsByJobId(jobId);
		return { data: payments, total: payments.length };
	}

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
		return earnings;
	}

	@Get("provider/:providerId/transactions")
	@UseGuards(JwtAuthGuard)
	async getProviderTransactions(
		@Param("providerId", ParseUUIDPipe) providerId: string,
		@Query() queryDto: TransactionQueryDto,
	) {
		return this.paymentService.getProviderTransactions(providerId, queryDto);
	}

	@Get(":id([0-9a-fA-F-]{36})")
	@UseGuards(JwtAuthGuard)
	async getPaymentById(@Param("id", ParseUUIDPipe) id: string) {
		const payment = await this.paymentService.getPaymentById(id);

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
	async getPaymentStatus(@Param("id", ParseUUIDPipe) id: string) {
		const payment = await this.paymentService.getPaymentById(id);

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
		@Param("id", ParseUUIDPipe) id: string,
		@Body() requestRefundDto: RequestRefundDto,
		@Request() req: any,
	) {
		const refund = await this.refundService.createRefund(id, requestRefundDto.amount);

		return refund;
	}

	/**
	 * Get provider earnings summary
	 * GET /payments/provider/:providerId/summary
	 */
}
