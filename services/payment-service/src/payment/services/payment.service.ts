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
	) {}

	async createPayment(
		jobId: string,
		amount: number,
		currency: string,
		userId: string,
		providerId: string,
		couponCode?: string,
	): Promise<Payment> {
		this.logger.log(`Creating payment for job ${jobId}`, "PaymentService");

		let finalAmount = amount;

		// Apply coupon if provided
		if (couponCode) {
			const discount = await this.couponService.validateAndUseCoupon(couponCode, userId);
			finalAmount = amount * (1 - discount / 100);
			this.logger.log(`Coupon ${couponCode} applied. Original: ${amount}, Final: ${finalAmount}`, "PaymentService");
		}

		// In production, this would integrate with a payment gateway (Stripe, PayPal, etc.)
		// For now, we simulate payment processing
		const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		const payment = await this.paymentRepository.createPayment(
			jobId,
			userId,
			providerId,
			finalAmount,
			currency,
			"card",
			transactionId,
		);

		// Simulate payment processing - in real scenario, this would be async
		// and status would be updated via webhook
		await this.paymentRepository.updatePaymentStatus(payment.id, "completed", transactionId);

		this.logger.log(`Payment created successfully: ${payment.id}`, "PaymentService");

		// Send payment confirmation email
		const userEmail = await this.userClient.getUserEmail(userId);
		if (userEmail) {
			this.notificationClient
				.sendEmail({
					to: userEmail,
					template: "paymentReceived",
					variables: { amount: finalAmount, currency: currency, transactionId: transactionId, serviceName: "Service" },
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
			},
		});

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

		return { data: data as any, total };
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

		const result = await this.paymentRepository.getProviderTransactions(providerId, queryDto);

		return {
			data: result.data.map((t: any) => ({
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
				customer_name: t.customer_name || "Unknown",
			})),
			...(queryDto.cursor ? {} : { total: result.total }),
			nextCursor: result.nextCursor,
			hasMore: result.hasMore,
		};
	}

	async getProviderPayouts(providerId: string): Promise<any[]> {
		this.logger.log(`Fetching payouts for provider ${providerId}`, "PaymentService");
		return this.paymentRepository.getProviderPayouts(providerId);
	}
}
