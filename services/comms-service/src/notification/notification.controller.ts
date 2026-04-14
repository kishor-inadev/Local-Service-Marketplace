import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  Request,
  Inject,
  LoggerService,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "@/common/pipes/strict-uuid.pipe";
import { Throttle } from "@nestjs/throttler";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { NotificationService } from "./services/notification.service";
import { EmailWorkerService } from "./services/email-worker.service";
import { PushWorkerService } from "./services/push-worker.service";
import { FeatureFlagService } from "./services/feature-flag.service";
import { UnsubscribeRepository } from "./repositories/unsubscribe.repository";
import { SendNotificationDto } from "./dto/send-notification.dto";
import { SendEmailDto } from "./dto/send-email.dto";
import { SendSmsDto, SendOtpDto, VerifyOtpDto } from "./dto/send-sms.dto";
import { UnsubscribeDto, CheckUnsubscribeDto } from "./dto/unsubscribe.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { InternalServiceGuard } from "@/common/guards/internal-service.guard";
import { SkipAuth } from "@/common/decorators/skip-auth.decorator";

@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly notificationService: NotificationService,
    private readonly emailWorker: EmailWorkerService,
    private readonly pushWorker: PushWorkerService,
    private readonly unsubscribeRepo: UnsubscribeRepository,
    private readonly featureFlags: FeatureFlagService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async getNotifications(
    @Request() req: any,
    @Headers("x-user-id") headerUserId: string,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const userId = req.user?.userId || headerUserId;

    if (!userId) {
      throw new UnauthorizedException("User ID is required");
    }

    // Feature flag check: In-app notifications
    if (!this.featureFlags.inAppNotificationsEnabled) {
      throw new BadRequestException(
        "In-app notifications are disabled. Set IN_APP_NOTIFICATIONS_ENABLED=true to enable this feature.",
      );
    }

    this.logger.log(
      `GET /notifications - Get notifications for user ${userId}`,
      "NotificationController",
    );
    const notifications =
      await this.notificationService.getNotificationsByUserId(userId, limit);
    const unreadCount = await this.notificationService.getUnreadCount(userId);
    const total = await this.notificationService.getTotalCount(userId);
    return {
      success: true,
      message: "Notifications retrieved successfully",
      data: { notifications, unreadCount },
      meta: {
        page: 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get("features")
  async getFeatures() {
    this.logger.log(
      "GET /notifications/features - Get enabled features",
      "NotificationController",
    );
    const features = {
      enabled_channels: this.featureFlags.getEnabledChannels(),
      features: {
        email: this.featureFlags.emailEnabled,
        sms: this.featureFlags.smsEnabled,
        in_app_notifications: this.featureFlags.inAppNotificationsEnabled,
        push_notifications: this.featureFlags.pushNotificationsEnabled,
        notification_preferences:
          this.featureFlags.notificationPreferencesEnabled,
        device_tracking: this.featureFlags.deviceTrackingEnabled,
      },
    };
    return {
      message: "Notification features retrieved successfully",
      data: features,
    };
  }

  @Get("unread-count")
  async getUnreadCount(@Headers("x-user-id") userId: string) {
    this.logger.log(
      `GET /notifications/unread-count for user ${userId}`,
      "NotificationController",
    );
    const count = await this.notificationService.getUnreadCount(userId);
    return { message: "Unread count retrieved successfully", data: { count } };
  }

  @Patch("read-all")
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(
    @Request() req: any,
    @Headers("x-user-id") headerUserId: string,
  ) {
    const userId = req.user?.userId || headerUserId;
    if (!userId) throw new UnauthorizedException("User ID is required");

    this.logger.log(
      `PATCH /notifications/read-all for user ${userId}`,
      "NotificationController",
    );
    await this.notificationService.markAllAsRead(userId);
    return { message: "All notifications marked as read" };
  }

  @Get(":id")
  async getNotification(
    @Param("id", FlexibleIdPipe) id: string,
    @Request() req: any,
    @Headers("x-user-id") headerUserId: string,
  ) {
    const userId = req.user?.userId || headerUserId;
    if (!userId) throw new UnauthorizedException("User ID is required");

    // Feature flag check: In-app notifications
    if (!this.featureFlags.inAppNotificationsEnabled) {
      throw new BadRequestException(
        "In-app notifications are disabled. Set IN_APP_NOTIFICATIONS_ENABLED=true to enable this feature.",
      );
    }

    this.logger.log(
      `GET /notifications/${id} - Get notification`,
      "NotificationController",
    );
    const notification = await this.notificationService.getNotificationById(
      id,
      userId,
    );
    return notification;
  }

  @Patch(":id/read")
  async markAsRead(
    @Param("id", StrictUuidPipe) id: string,
    @Request() req: any,
    @Headers("x-user-id") headerUserId: string,
  ) {
    const userId = req.user?.userId || headerUserId;
    if (!userId) throw new UnauthorizedException("User ID is required");

    // Feature flag check: In-app notifications
    if (!this.featureFlags.inAppNotificationsEnabled) {
      throw new BadRequestException(
        "In-app notifications are disabled. Set IN_APP_NOTIFICATIONS_ENABLED=true to enable this feature.",
      );
    }

    this.logger.log(
      `PATCH /notifications/${id}/read - Mark as read`,
      "NotificationController",
    );
    const notification = await this.notificationService.markAsRead(id, userId);
    return notification;
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(
    @Param("id", StrictUuidPipe) id: string,
    @Request() req: any,
    @Headers("x-user-id") headerUserId: string,
  ) {
    const userId = req.user?.userId || headerUserId;
    if (!userId) throw new UnauthorizedException("User ID is required");

    this.logger.log(
      `DELETE /notifications/${id} - Delete notification`,
      "NotificationController",
    );
    await this.notificationService.deleteNotification(id, userId);
  }

  // ========== NEW ENDPOINTS: Email & SMS via HTTP ==========

  /**
   * Send notification via email, SMS, or both
   * This is the main endpoint that other services should use
   * Rate limited to 20 notifications per minute
   */
  @SkipAuth()
  @UseGuards(InternalServiceGuard)
  @Post("send")
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async sendNotification(
    @Body() dto: SendNotificationDto,
    @Headers("x-app") xApp?: string,
    @Headers("x-app-url") xAppUrl?: string,
    @Headers("x-path") xPath?: string,
  ) {
    // Inject app context from headers if not provided in body
    dto.appContext = {
      applicationName:
        dto.appContext?.applicationName ||
        xApp?.trim() ||
        this.configService.get("APPLICATION_NAME"),
      appUrl:
        dto.appContext?.appUrl ||
        xAppUrl?.trim() ||
        this.configService.get("APP_URL"),
      ctaPath: dto.appContext?.ctaPath || xPath?.trim() || null,
    };

    this.logger.log(
      `POST /notifications/send - Sending ${dto.channel} notification to ${dto.recipient}`,
      "NotificationController",
    );
    const result = await this.notificationService.sendNotification(dto);
    return { message: "Notification sent successfully", data: result };
  }

  /**
   * Send email directly (legacy endpoint, use /send instead)
   * Rate limited to 10 emails per minute per IP
   */
  @SkipAuth()
  @UseGuards(InternalServiceGuard)
  @Post("email/send")
  @Throttle({ email: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async sendEmail(
    @Body() dto: SendEmailDto,
    @Headers("x-app") xApp?: string,
    @Headers("x-app-url") xAppUrl?: string,
    @Headers("x-path") xPath?: string,
  ) {
    // Inject app context from headers if not provided in body
    dto.appContext = {
      applicationName:
        dto.appContext?.applicationName ||
        xApp?.trim() ||
        this.configService.get("APPLICATION_NAME"),
      appUrl:
        dto.appContext?.appUrl ||
        xAppUrl?.trim() ||
        this.configService.get("APP_URL"),
      ctaPath: dto.appContext?.ctaPath || xPath?.trim() || null,
    };

    this.logger.log(
      `POST /notifications/email/send - Sending email to ${dto.to}`,
      "NotificationController",
    );
    const result = await this.notificationService.sendEmailDirect(dto);
    return { message: "Email sent successfully", data: result };
  }

  /**
   * Send SMS directly
   * Rate limited to 5 SMS per hour per IP
   */
  @SkipAuth()
  @UseGuards(InternalServiceGuard)
  @Post("sms/send")
  @Throttle({ sms: { limit: 5, ttl: 3600000 } })
  @HttpCode(HttpStatus.OK)
  async sendSms(@Body() dto: SendSmsDto) {
    this.logger.log(
      `POST /notifications/sms/send - Sending SMS to ${dto.phone}`,
      "NotificationController",
    );
    const result = await this.notificationService.sendSmsDirect(dto);
    return { message: "SMS sent successfully", data: result };
  }

  /**
   * Send OTP via SMS
   * Rate limited to 5 OTP per hour per IP
   */
  @SkipAuth()
  @UseGuards(InternalServiceGuard)
  @Post("otp/send")
  @Throttle({ sms: { limit: 5, ttl: 3600000 } })
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    this.logger.log(
      `POST /notifications/otp/send - Sending OTP to ${dto.phone}`,
      "NotificationController",
    );
    const result = await this.notificationService.sendOtp(
      dto.phone,
      dto.purpose,
    );
    return { message: "OTP sent successfully", data: result };
  }

  /**
   * Enqueue WhatsApp OTP via comms-service WhatsApp worker.
   * Called by identity-service when WHATSAPP_OTP_ENABLED=true.
   */
  @SkipAuth()
  @UseGuards(InternalServiceGuard)
  @Post("whatsapp/otp")
  @Throttle({ sms: { limit: 5, ttl: 3600000 } })
  @HttpCode(HttpStatus.OK)
  async sendWhatsAppOtp(@Body() dto: { phone: string; otp: string }) {
    this.logger.log(
      `POST /notifications/whatsapp/otp - Enqueuing WhatsApp OTP to ${dto.phone}`,
      "NotificationController",
    );
    await this.notificationService.enqueueWhatsAppOtp(dto.phone, dto.otp);
    return { message: "WhatsApp OTP enqueued" };
  }

  /**
   * Verify OTP
   */
  @SkipAuth()
  @UseGuards(InternalServiceGuard)
  @Post("otp/verify")
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    this.logger.log(
      `POST /notifications/otp/verify - Verifying OTP for ${dto.phone}`,
      "NotificationController",
    );
    const result = await this.notificationService.verifyOtp(
      dto.phone,
      dto.code,
      dto.purpose,
    );
    return { message: "OTP verified successfully", data: result };
  }

  // ========== Worker endpoints (for background job scheduler) ==========

  @SkipAuth()
  @UseGuards(InternalServiceGuard)
  @Post("workers/process-emails")
  @HttpCode(HttpStatus.OK)
  async processEmails() {
    this.logger.log(
      "POST /notifications/workers/process-emails - Process email queue",
      "NotificationController",
    );
    await this.emailWorker.processPendingEmails();
    return {};
  }

  @SkipAuth()
  @UseGuards(InternalServiceGuard)
  @Post("workers/process-push")
  @HttpCode(HttpStatus.OK)
  async processPush() {
    // Feature flag check: Push notifications
    if (!this.featureFlags.pushNotificationsEnabled) {
      throw new BadRequestException(
        "Push notifications are disabled. Set PUSH_NOTIFICATIONS_ENABLED=true to enable this feature.",
      );
    }

    this.logger.log(
      "POST /notifications/workers/process-push - Process push queue",
      "NotificationController",
    );
    await this.pushWorker.processPendingPushNotifications();
    return {};
  }

  // ========== Unsubscribe endpoints ==========

  /**
   * Unsubscribe from email notifications
   */
  @Post("unsubscribe")
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    this.logger.log(
      `POST /notifications/unsubscribe - Unsubscribe ${dto.email}`,
      "NotificationController",
    );

    // Check if already unsubscribed
    const existing = await this.unsubscribeRepo.findByEmail(dto.email);
    if (existing) {
      return { unsubscribed: true, unsubscribed_at: existing.unsubscribed_at };
    }

    const record = await this.unsubscribeRepo.create(
      dto.email,
      undefined,
      dto.reason,
    );

    return { unsubscribed: true, unsubscribed_at: record.unsubscribed_at };
  }

  /**
   * Check if email is unsubscribed
   */
  @Post("unsubscribe/check")
  @HttpCode(HttpStatus.OK)
  async checkUnsubscribe(@Body() dto: CheckUnsubscribeDto) {
    this.logger.log(
      `POST /notifications/unsubscribe/check - Check ${dto.email}`,
      "NotificationController",
    );

    const isUnsubscribed = await this.unsubscribeRepo.isUnsubscribed(dto.email);

    return { email: dto.email, unsubscribed: isUnsubscribed };
  }

  /**
   * Resubscribe to email notifications
   */
  @Post("resubscribe")
  @HttpCode(HttpStatus.OK)
  async resubscribe(@Body() dto: CheckUnsubscribeDto) {
    this.logger.log(
      `POST /notifications/resubscribe - Resubscribe ${dto.email}`,
      "NotificationController",
    );

    await this.unsubscribeRepo.delete(dto.email);

    return { unsubscribed: false };
  }
}
