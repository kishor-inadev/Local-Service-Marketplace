import { Test, TestingModule } from "@nestjs/testing";
import { NotificationService } from "./notification.service";
import { NotificationRepository } from "../repositories/notification.repository";
import { NotificationDeliveryRepository } from "../repositories/notification-delivery.repository";
import { UnsubscribeRepository } from "../repositories/unsubscribe.repository";
import { EmailClient } from "../clients/email.client";
import { SmsClient } from "../clients/sms.client";
import { FeatureFlagService } from "./feature-flag.service";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { getQueueToken } from "@nestjs/bullmq";
import { NotFoundException } from "../../common/exceptions/http.exceptions";
import { ForbiddenException, BadRequestException } from "@nestjs/common";
import { NotificationChannel } from "../dto/send-notification.dto";

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockNotification = {
  id: "notif-uuid-1",
  user_id: "user-uuid-1",
  type: "request_created",
  message: "Your request was created",
  read: false,
  created_at: new Date(),
};

const mockNotifRepo = {
  createNotification: jest.fn(),
  getNotificationById: jest.fn(),
  getNotificationsByUserId: jest.fn(),
  markAsRead: jest.fn(),
  getUnreadCount: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
};

const mockDeliveryRepo = { createDelivery: jest.fn() };
const mockUnsubscribeRepo = { isUnsubscribed: jest.fn() };
const mockEmailClient = { sendEmail: jest.fn() };
const mockSmsClient = { sendSms: jest.fn() };
const mockEmailQueue = { add: jest.fn().mockResolvedValue({}) };
const mockSmsQueue = { add: jest.fn().mockResolvedValue({}) };
const mockPushQueue = { add: jest.fn().mockResolvedValue({}) };
const mockWhatsappQueue = { add: jest.fn().mockResolvedValue({}) };

const mockFeatureFlags = {
  emailEnabled: true,
  smsEnabled: true,
  inAppNotificationsEnabled: true,
  pushNotificationsEnabled: true,
  notificationPreferencesEnabled: true,
  deviceTrackingEnabled: false,
  isFeatureEnabled: jest.fn().mockReturnValue(true),
  getEnabledChannels: jest.fn().mockReturnValue(["email", "sms", "in_app"]),
  checkFeatureOrThrow: jest.fn(),
};

describe("NotificationService", () => {
  let service: NotificationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
        { provide: getQueueToken("comms.email"), useValue: mockEmailQueue },
        { provide: getQueueToken("comms.sms"), useValue: mockSmsQueue },
        { provide: getQueueToken("comms.push"), useValue: mockPushQueue },
        { provide: getQueueToken("comms.whatsapp"), useValue: mockWhatsappQueue },
        { provide: NotificationRepository, useValue: mockNotifRepo },
        { provide: NotificationDeliveryRepository, useValue: mockDeliveryRepo },
        { provide: UnsubscribeRepository, useValue: mockUnsubscribeRepo },
        { provide: EmailClient, useValue: mockEmailClient },
        { provide: SmsClient, useValue: mockSmsClient },
        { provide: FeatureFlagService, useValue: mockFeatureFlags },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  describe("createNotification", () => {
    it("should create notification and queue email", async () => {
      mockNotifRepo.createNotification.mockResolvedValue(mockNotification);
      mockDeliveryRepo.createDelivery.mockResolvedValue({ id: "del-1" });

      const result = await service.createNotification(
        "user-uuid-1",
        "request_created",
        "Your request was created",
      );

      expect(result).toEqual(mockNotification);
      expect(mockNotifRepo.createNotification).toHaveBeenCalledWith(
        "user-uuid-1",
        "request_created",
        "Your request was created",
      );
      expect(mockDeliveryRepo.createDelivery).toHaveBeenCalledTimes(2); // email + push
      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        "deliver-email",
        expect.objectContaining({
          userId: "user-uuid-1",
          type: "request_created",
        }),
      );
    });
  });

  describe("getNotificationById", () => {
    it("should return notification when found", async () => {
      mockNotifRepo.getNotificationById.mockResolvedValue(mockNotification);
      const result = await service.getNotificationById("notif-uuid-1");
      expect(result).toEqual(mockNotification);
    });

    it("should throw NotFoundException when not found", async () => {
      mockNotifRepo.getNotificationById.mockResolvedValue(null);
      await expect(service.getNotificationById("missing")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ForbiddenException when userId does not match", async () => {
      mockNotifRepo.getNotificationById.mockResolvedValue(mockNotification);
      await expect(
        service.getNotificationById("notif-uuid-1", "other-user"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should allow access when userId matches", async () => {
      mockNotifRepo.getNotificationById.mockResolvedValue(mockNotification);
      const result = await service.getNotificationById(
        "notif-uuid-1",
        "user-uuid-1",
      );
      expect(result).toEqual(mockNotification);
    });
  });

  describe("getNotificationsByUserId", () => {
    it("should return notifications list", async () => {
      mockNotifRepo.getNotificationsByUserId.mockResolvedValue([
        mockNotification,
      ]);
      const result = await service.getNotificationsByUserId("user-uuid-1");
      expect(result).toHaveLength(1);
    });

    it("should pass limit parameter", async () => {
      mockNotifRepo.getNotificationsByUserId.mockResolvedValue([]);
      await service.getNotificationsByUserId("user-uuid-1", 10);
      expect(mockNotifRepo.getNotificationsByUserId).toHaveBeenCalledWith(
        "user-uuid-1",
        10,
      );
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const readNotif = { ...mockNotification, read: true };
      mockNotifRepo.getNotificationById.mockResolvedValue(mockNotification);
      mockNotifRepo.markAsRead.mockResolvedValue(readNotif);
      const result = await service.markAsRead("notif-uuid-1", "user-uuid-1");
      expect(result.read).toBe(true);
    });

    it("should return early if already read", async () => {
      const alreadyRead = { ...mockNotification, read: true };
      mockNotifRepo.getNotificationById.mockResolvedValue(alreadyRead);
      const result = await service.markAsRead("notif-uuid-1", "user-uuid-1");
      expect(result.read).toBe(true);
      expect(mockNotifRepo.markAsRead).not.toHaveBeenCalled();
    });
  });

  describe("getUnreadCount", () => {
    it("should return unread count", async () => {
      mockNotifRepo.getUnreadCount.mockResolvedValue(5);
      const result = await service.getUnreadCount("user-uuid-1");
      expect(result).toBe(5);
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all notifications as read", async () => {
      mockNotifRepo.markAllAsRead.mockResolvedValue(undefined);
      await service.markAllAsRead("user-uuid-1");
      expect(mockNotifRepo.markAllAsRead).toHaveBeenCalledWith("user-uuid-1");
    });
  });

  describe("deleteNotification", () => {
    it("should delete owned notification", async () => {
      mockNotifRepo.getNotificationById.mockResolvedValue(mockNotification);
      mockNotifRepo.deleteNotification.mockResolvedValue(undefined);
      await service.deleteNotification("notif-uuid-1", "user-uuid-1");
      expect(mockNotifRepo.deleteNotification).toHaveBeenCalledWith(
        "notif-uuid-1",
      );
    });

    it("should throw ForbiddenException if not owner", async () => {
      mockNotifRepo.getNotificationById.mockResolvedValue(mockNotification);
      await expect(
        service.deleteNotification("notif-uuid-1", "other-user"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("sendNotification", () => {
    it("should send email when channel is EMAIL", async () => {
      mockEmailClient.sendEmail.mockResolvedValue({
        success: true,
        messageId: "mid-1",
      });
      const result = await service.sendNotification({
        channel: NotificationChannel.EMAIL,
        recipient: "user@example.com",
        subject: "Test",
        message: "Hello",
      });
      expect(result.success).toBe(true);
      expect(mockEmailClient.sendEmail).toHaveBeenCalled();
      expect(mockSmsClient.sendSms).not.toHaveBeenCalled();
    });

    it("should send SMS when channel is SMS", async () => {
      const result = await service.sendNotification({
        channel: NotificationChannel.SMS,
        recipient: "+1234567890",
        subject: "N/A",
        message: "Hello",
      });
      expect(result.success).toBe(true);
      expect(mockSmsClient.sendSms).toHaveBeenCalledWith(
        "+1234567890",
        "Hello",
      );
    });

    it("should send both when channel is BOTH", async () => {
      mockEmailClient.sendEmail.mockResolvedValue({ success: true });
      const result = await service.sendNotification({
        channel: NotificationChannel.BOTH,
        recipient: "user@example.com",
        subject: "Test",
        message: "Hello",
      });
      expect(result.success).toBe(true);
      expect(mockEmailClient.sendEmail).toHaveBeenCalled();
      expect(mockSmsClient.sendSms).toHaveBeenCalledWith(
        "user@example.com",
        "Hello",
      );
    });

    it("should return error on failure", async () => {
      mockEmailClient.sendEmail.mockRejectedValue(new Error("SMTP failure"));
      const result = await service.sendNotification({
        channel: NotificationChannel.EMAIL,
        recipient: "user@example.com",
        subject: "Test",
        message: "Hello",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("SMTP failure");
    });
  });

  describe("sendEmailDirect", () => {
    it("should send email when user is not unsubscribed", async () => {
      mockUnsubscribeRepo.isUnsubscribed.mockResolvedValue(false);
      mockEmailClient.sendEmail.mockResolvedValue({
        success: true,
        messageId: "mid-1",
      });
      const result = await service.sendEmailDirect({
        to: "user@example.com",
        subject: "Test",
        message: "Hello",
      });
      expect(result.success).toBe(true);
    });

    it("should skip sending if user unsubscribed", async () => {
      mockUnsubscribeRepo.isUnsubscribed.mockResolvedValue(true);
      const result = await service.sendEmailDirect({
        to: "user@example.com",
        subject: "Test",
        message: "Hello",
      });
      expect(result.success).toBe(false);
      expect((result as any).reason).toBe("unsubscribed");
      expect(mockEmailClient.sendEmail).not.toHaveBeenCalled();
    });

    it("should throw when email feature is disabled", async () => {
      // Temporarily override feature flag
      Object.defineProperty(mockFeatureFlags, "emailEnabled", {
        value: false,
        writable: true,
      });
      await expect(
        service.sendEmailDirect({
          to: "user@example.com",
          subject: "Test",
          message: "Hello",
        }),
      ).rejects.toThrow(BadRequestException);
      Object.defineProperty(mockFeatureFlags, "emailEnabled", {
        value: true,
        writable: true,
      });
    });
  });
});
