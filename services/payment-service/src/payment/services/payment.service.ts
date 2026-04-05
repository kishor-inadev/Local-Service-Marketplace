import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PaymentRepository } from '../repositories/payment.repository';
import { CouponService } from './coupon.service';
import { Payment } from '../entities/payment.entity';
import { NotFoundException, BadRequestException } from '../../common/exceptions/http.exceptions';
import { validateCursorMode, validateDateRange } from "../../common/pagination/list-query-validation.util";
import { KafkaService } from '../../kafka/kafka.service';
import { NotificationClient } from '../../common/notification/notification.client';
import { UserClient } from '../../common/user/user.client';
import { AnalyticsClient } from '../../common/analytics/analytics.client';
import { PaymentGatewayService } from "../gateway/payment-gateway.service";
import {
	PaginatedTransactionResponseDto,
	SortOrder,
	TransactionQueryDto,
	TransactionSortBy,
} from "../dto/transaction-query.dto";

@Injectable()
export class PaymentService {
	constructor(
		@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
		private readonly paymentRepository: PaymentRepository,
		private readonly couponService: CouponService,
		private readonly kafkaService: KafkaService,
		private readonly notificationClient: NotificationClient,
		private readonly userClient: UserClient,
		private readonly analyticsClient: AnalyticsClient,
		private readonly paymentGateway: PaymentGatewayService,
	) {}

	async createPayment(
		jobId: string,
		amount: number,
		currency: string,
		userId: string,
		providerId: string,
		couponCode?: string,
		gateway?: string,
	): Promise<Payment> {
		this.logger.log(`Creating payment for job ${jobId}`, "PaymentService");

		let finalAmount = amount;

		// Apply coupon if provided
		if (couponCode) {
			const discount = await this.couponService.validateAndUseCoupon(couponCode, userId);
			finalAmount = amount * (1 - discount / 100);
			this.logger.log(`Coupon ${couponCode} applied. Original: ${amount}, Final: ${finalAmount}`, "PaymentService");
		}

		// Pre-fetch user info — needed by PayUbiz (firstname/email) and Instamojo (buyer_name/email).
		// Non-blocking: charge proceeds with defaults if identity-service is temporarily unavailable.
		const user = await this.userClient.getUserById(userId).catch(() => null);

		// Charge via payment gateway — per-request override via X-Payment-Gateway header
		const chargeParams = {
			amount: finalAmount,
			currency,
			description: `Job ${jobId} payment`,
			customerEmail: user?.email,
			customerName: user?.name,
			metadata: { job_id: jobId, user_id: userId, provider_id: providerId },
		};
		const chargeResult =
			gateway ?
				await this.paymentGateway.chargeWith(gateway, chargeParams)
			:	await this.paymentGateway.charge(chargeParams);

		const activeGatewayName = gateway ?? this.paymentGateway.getActiveGatewayName();

		const payment = await this.paymentRepository.createPayment(
			jobId,
			userId,
			providerId,
			finalAmount,
			currency,
			"card",
			chargeResult.transactionId,
			activeGatewayName,
		);

		// Mark as completed immediately for succeeded gateway responses.
		// For 'pending' (async confirmations), status is updated via Stripe webhook.
		const paymentStatus = chargeResult.status === "succeeded" ? "completed" : "pending";
		await this.paymentRepository.updatePaymentStatus(payment.id, paymentStatus, chargeResult.transactionId);

		this.logger.log(`Payment created: ${payment.id}, gateway status: ${chargeResult.status}`, "PaymentService");

		// Send payment confirmation email (reuse pre-fetched user — avoids a second HTTP call)
		const userEmail = user?.email ?? null;
		if (userEmail) {
			this.notificationClient
				.sendEmail({
					to: userEmail,
					template: "paymentReceived",
					variables: {
						amount: finalAmount,
						currency: currency,
						transactionId: chargeResult.transactionId,
						serviceName: "Service",
					},
				})
				.catch((err) => {
					this.logger.warn(`Failed to send payment confirmation: ${err.message}`, "PaymentService");
				});
		}

		// Publish event to Kafka if enabled
		await this.kafkaService.publishEvent("payment-events", {
			eventType: "payment_completed",
			eventId: `${payment.id}-${Date.now()}`,
			timestamp: new Date().toISOString(),
			data: {
				paymentId: payment.id,
				jobId: payment.job_id,
				amount: payment.amount,
				currency: payment.currency,
				status: "completed",
				transactionId: payment.transaction_id,
				gateway: activeGatewayName,
			},
		});

		// Track analytics (HTTP fallback when Kafka is disabled)
		this.analyticsClient.track({
			userId: userId,
			action: "payment_completed",
			resource: "payment",
			resourceId: payment.id,
			metadata: { jobId: payment.job_id, amount: finalAmount, currency, providerId },
		});

		// Attach gateway_response so the controller can forward redirect fields to
		// the frontend (PayUbiz form POST fields, Instamojo longurl, etc.).
		if (chargeResult.gatewayResponse) {
			(payment as any).gateway_response = chargeResult.gatewayResponse;
		}

		return payment;
	}

	async getPaymentById(id: string): Promise<Payment> {
		this.logger.log(`Fetching payment ${id}`, "PaymentService");
		const payment = await this.paymentRepository.getPaymentById(id);
		if (!payment) {
			throw new NotFoundException("Payment not found");
		}
		return payment;
	}

	async getPaymentsByJobId(jobId: string): Promise<Payment[]> {
		this.logger.log(`Fetching payments for job ${jobId}`, "PaymentService");
		return this.paymentRepository.getPaymentsByJobId(jobId);
	}

	async updatePaymentStatus(
		id: string,
		status: "pending" | "completed" | "failed" | "refunded",
		transactionId?: string,
	): Promise<Payment> {
		this.logger.log(`Updating payment ${id} status to ${status}`, "PaymentService");
		const payment = await this.getPaymentById(id);

		if (payment.status === "refunded" && status !== "refunded") {
			throw new BadRequestException("Cannot change status of refunded payment");
		}

		return this.paymentRepository.updatePaymentStatus(id, status, transactionId);
	}

	async getPaymentsByUser(userId: string): Promise<Payment[]> {
		this.logger.log(`Fetching payments for user ${userId}`, "PaymentService");
		return this.paymentRepository.getPaymentsByUser(userId);
	}

	async getPaymentsByUserPaginated(
		userId: string,
		queryDto: TransactionQueryDto,
	): Promise<PaginatedTransactionResponseDto> {
		validateDateRange(queryDto.created_from, queryDto.created_to, "created_from", "created_to");
		validateCursorMode(
			queryDto.cursor,
			queryDto.page,
			queryDto.sortBy,
			queryDto.sortOrder,
			TransactionSortBy.CREATED_AT,
			SortOrder.DESC,
		);

		const limit = queryDto.limit || 20;

		if (queryDto.cursor) {
			const payments = await this.paymentRepository.getPaymentsByUserPaginated(userId, queryDto);
			const hasMore = payments.length > limit;
			const data = payments.slice(0, limit);
			const nextCursor = hasMore && data.length > 0 ? (data[data.length - 1].created_at as any) : undefined;
			return { data: data as any, nextCursor, hasMore };
		}

		const [data, total] = await Promise.all([
			this.paymentRepository.getPaymentsByUserPaginated(userId, queryDto),
			this.paymentRepository.countPaymentsByUser(userId, queryDto),
		]);

		return { data: data as any, total, page: queryDto.page || 1, limit };
	}

	async getProviderEarnings(providerId: string, startDate?: Date, endDate?: Date): Promise<any> {
		this.logger.log(`Fetching earnings for provider ${providerId}`, "PaymentService");

		// Get earnings summary from repository
		const summary = await this.paymentRepository.getProviderEarnings(providerId, startDate, endDate);

		// Get monthly breakdown
		const monthly = await this.paymentRepository.getProviderEarningsByMonth(providerId, startDate, endDate);

		// Calculate average
		const avgPerJob = summary.completed_count > 0 ? summary.total_earnings / summary.completed_count : 0;

		return {
			summary: {
				total_earnings: parseFloat(summary.total_earnings) || 0,
				total_paid: parseFloat(summary.total_paid) || 0,
				pending_payout: parseFloat(summary.pending_payout) || 0,
				completed_count: parseInt(summary.completed_count) || 0,
				currency: summary.currency || "USD",
			},
			monthly: monthly.map((m) => ({
				month: m.month,
				earnings: parseFloat(m.earnings) || 0,
				job_count: parseInt(m.job_count) || 0,
			})),
			average_per_job: avgPerJob,
		};
	}

	async getProviderTransactions(
		providerId: string,
		queryDto: TransactionQueryDto,
	): Promise<PaginatedTransactionResponseDto> {
		this.logger.log(`Fetching transactions for provider ${providerId}`, "PaymentService");

		validateDateRange(queryDto.created_from, queryDto.created_to, "created_from", "created_to");
		validateCursorMode(
			queryDto.cursor,
			queryDto.page,
			queryDto.sortBy,
			queryDto.sortOrder,
			TransactionSortBy.CREATED_AT,
			SortOrder.DESC,
		);

		const limit = queryDto.limit || 20;

		const result = await this.paymentRepository.getProviderTransactions(providerId, queryDto);

		// Fetch customer names via identity-service API (no cross-service DB joins)
		const userIds = [...new Set(result.data.map((t: any) => t.user_id).filter(Boolean))];
		const userNameMap: Record<string, string> = {};
		await Promise.all(
			userIds.map(async (userId: string) => {
				const user = await this.userClient.getUserById(userId);
				if (user?.name) userNameMap[userId] = user.name;
			}),
		);

		const data = result.data.map((t: any) => ({
			id: t.id,
			job_id: t.job_id,
			customer_id: t.user_id,
			provider_amount: parseFloat(t.provider_amount) || 0,
			platform_fee: parseFloat(t.platform_fee) || 0,
			total_amount: parseFloat(t.amount) || 0,
			status: t.status,
			payment_method: t.payment_method || "card",
			transaction_id: t.transaction_id || "",
			currency: t.currency || "USD",
			created_at: t.created_at,
			paid_at: t.paid_at || null,
			customer_name: userNameMap[t.user_id] || "Unknown",
		}));

		if (queryDto.cursor) {
			return { data, nextCursor: result.nextCursor, hasMore: result.hasMore };
		}

		return { data, total: result.total, page: queryDto.page || 1, limit };
	}

	async getProviderPayouts(providerId: string): Promise<any[]> {
		this.logger.log(`Fetching payouts for provider ${providerId}`, "PaymentService");
		return this.paymentRepository.getProviderPayouts(providerId);
	}

	async getPaymentStats(): Promise<{
		total: number;
		totalRevenue: number;
		byStatus: { pending: number; completed: number; failed: number; refunded: number };
	}> {
		this.logger.log(`Fetching payment stats`, "PaymentService");
		return this.paymentRepository.getPaymentStats();
	}
}
