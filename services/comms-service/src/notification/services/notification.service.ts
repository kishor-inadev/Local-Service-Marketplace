import { Injectable, Inject, LoggerService, BadRequestException, ForbiddenException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { NotificationRepository } from "../repositories/notification.repository";
import { NotificationDeliveryRepository } from "../repositories/notification-delivery.repository";
import { UnsubscribeRepository } from "../repositories/unsubscribe.repository";
import { Notification } from "../entities/notification.entity";
import { NotFoundException } from "../../common/exceptions/http.exceptions";
import { EmailClient } from "../clients/email.client";
import { SmsClient } from "../clients/sms.client";
import { FeatureFlagService } from "./feature-flag.service";
import { SendNotificationDto, NotificationChannel } from "../dto/send-notification.dto";
import { SendEmailDto } from "../dto/send-email.dto";
import { SendSmsDto } from "../dto/send-sms.dto";

@Injectable()
export class NotificationService {
	constructor(
		@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
		@InjectQueue("email-queue") private readonly emailQueue: Queue,
		private readonly notificationRepository: NotificationRepository,
		private readonly deliveryRepository: NotificationDeliveryRepository,
		private readonly unsubscribeRepository: UnsubscribeRepository,
		private readonly emailClient: EmailClient,
		private readonly smsClient: SmsClient,
		private readonly featureFlags: FeatureFlagService,
	) {}

	async createNotification(userId: string, type: string, message: string): Promise<Notification> {
		this.logger.log(`Creating notification for user ${userId}`, "NotificationService");
		const notification = await this.notificationRepository.createNotification(userId, type, message);

		// Create delivery records for email and push channels
		const emailDelivery = await this.deliveryRepository.createDelivery(notification.id, "email", "pending");
		const pushDelivery = await this.deliveryRepository.createDelivery(notification.id, "push", "pending");

		// Queue email sending job (background processing)
		await this.emailQueue.add(
			"send-email",
			{ deliveryId: emailDelivery.id, notification_id: notification.id, userId, type, message },
			{ attempts: 3, backoff: { type: "exponential", delay: 2000 } },
		);

		this.logger.log(`Notification created and queued successfully: ${notification.id}`, "NotificationService");
		return notification;
	}

	async getNotificationById(id: string, requestingUserId?: string): Promise<Notification> {
		this.logger.log(`Fetching notification ${id}`, "NotificationService");
		const notification = await this.notificationRepository.getNotificationById(id);
		if (!notification) {
			throw new NotFoundException("Notification not found");
		}
		if (requestingUserId && notification.user_id !== requestingUserId) {
			throw new ForbiddenException("Access denied");
		}
		return notification;
	}

	async getNotificationsByUserId(userId: string, limit: number = 50): Promise<Notification[]> {
		this.logger.log(`Fetching notifications for user ${userId}`, "NotificationService");
		return this.notificationRepository.getNotificationsByUserId(userId, limit);
	}

	async markAsRead(id: string, userId: string): Promise<Notification> {
		this.logger.log(`Marking notification ${id} as read`, "NotificationService");
		const notification = await this.getNotificationById(id, userId);

		if (notification.read) {
			this.logger.log(`Notification ${id} already marked as read`, "NotificationService");
			return notification;
		}

		const updatedNotification = await this.notificationRepository.markAsRead(notification.id);
		this.logger.log(`Notification ${id} marked as read successfully`, "NotificationService");
		return updatedNotification;
	}

	async getUnreadCount(userId: string): Promise<number> {
		this.logger.log(`Fetching unread count for user ${userId}`, "NotificationService");
		return this.notificationRepository.getUnreadCount(userId);
	}

	async markAllAsRead(userId: string): Promise<void> {
		this.logger.log(`Marking all notifications as read for user ${userId}`, "NotificationService");
		await this.notificationRepository.markAllAsRead(userId);
	}

	async deleteNotification(id: string, userId: string): Promise<void> {
		this.logger.log(`Deleting notification ${id}`, "NotificationService");
		const notification = await this.getNotificationById(id, userId); // throws 404 if not found, 403 if not owner
		await this.notificationRepository.deleteNotification(notification.id);
	}

	// ========== NEW METHODS: Direct Email/SMS via HTTP ==========

	/**
	 * Send notification via email, SMS, or both
	 * Uses direct HTTP calls to email-service and sms-service
	 * No Redis/Kafka required - works with or without queue infrastructure
	 */
	async sendNotification(dto: SendNotificationDto) {
		this.logger.log(`Sending ${dto.channel} notification to ${dto.recipient}`, "NotificationService");

		const results: any = { channel: dto.channel, recipient: dto.recipient };

		try {
			if (dto.channel === NotificationChannel.EMAIL || dto.channel === NotificationChannel.BOTH) {
				// Feature flag check: Email notifications
				if (!this.featureFlags.emailEnabled) {
					throw new BadRequestException(
						"Email notifications are disabled. Set EMAIL_ENABLED=true to enable this feature.",
					);
				}

				// Send via email
				const emailResult = await this.emailClient.sendEmail({
					to: dto.recipient,
					subject: dto.subject,
					text: dto.message,
					template: dto.template,
					variables: dto.variables,
				});

				results.email = emailResult;
			}

			if (dto.channel === NotificationChannel.SMS || dto.channel === NotificationChannel.BOTH) {
				// Feature flag check: SMS notifications
				if (!this.featureFlags.smsEnabled) {
					throw new BadRequestException("SMS notifications are disabled. Set SMS_ENABLED=true to enable this feature.");
				}

				// Send via SMS
				const smsResult = await this.smsClient.sendSms(dto.recipient, dto.message);
				results.sms = smsResult;
			}

			this.logger.log(`Notification sent successfully: ${JSON.stringify(results)}`, "NotificationService");
			return { success: true, ...results };
		} catch (error) {
			this.logger.error(`Failed to send notification: ${error.message}`, error.stack, "NotificationService");
			return { success: false, error: error.message };
		}
	}

	/**
	 * Send email directly via HTTP
	 */
	async sendEmailDirect(dto: SendEmailDto) {
		this.logger.log(`Sending email directly to ${dto.to}`, "NotificationService");

		// Feature flag check: Email notifications
		if (!this.featureFlags.emailEnabled) {
			throw new BadRequestException("Email notifications are disabled. Set EMAIL_ENABLED=true to enable this feature.");
		}

		// Check if user has unsubscribed
		const isUnsubscribed = await this.unsubscribeRepository.isUnsubscribed(dto.to);
		if (isUnsubscribed) {
			this.logger.warn(`Email ${dto.to} is unsubscribed, skipping email`, "NotificationService");
			return { success: false, message: "User has unsubscribed from email notifications", reason: "unsubscribed" };
		}

		const result = await this.emailClient.sendEmail({
			to: dto.to,
			subject: dto.subject,
			text: dto.message,
			template: dto.template,
			variables: dto.variables,
		});

		return result;
	}

	/**
	 * Send SMS directly via HTTP
	 */
	async sendSmsDirect(dto: SendSmsDto) {
		this.logger.log(`Sending SMS directly to ${dto.phone}`, "NotificationService");

		// Feature flag check: SMS notifications
		if (!this.featureFlags.smsEnabled) {
			throw new BadRequestException("SMS notifications are disabled. Set SMS_ENABLED=true to enable this feature.");
		}

		const result = await this.smsClient.sendSms(dto.phone, dto.message);

		return result;
	}

	/**
	 * Send OTP via SMS
	 */
	async sendOtp(phone: string, purpose: string = "login") {
		this.logger.log(`Sending OTP to ${phone} (purpose: ${purpose})`, "NotificationService");

		// Feature flag check: SMS notifications
		if (!this.featureFlags.smsEnabled) {
			throw new BadRequestException("SMS notifications are disabled. Set SMS_ENABLED=true to enable this feature.");
		}

		const result = await this.smsClient.sendOtp(phone, purpose);

		return result;
	}

	/**
	 * Verify OTP
	 */
	async verifyOtp(phone: string, code: string, purpose: string = "login") {
		this.logger.log(`Verifying OTP for ${phone} (purpose: ${purpose})`, "NotificationService");

		// Feature flag check: SMS notifications
		if (!this.featureFlags.smsEnabled) {
			throw new BadRequestException("SMS notifications are disabled. Set SMS_ENABLED=true to enable this feature.");
		}

		const result = await this.smsClient.verifyOtp(phone, code, purpose);

		return result;
	}
}
