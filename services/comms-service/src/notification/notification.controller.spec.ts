import { Test, TestingModule } from "@nestjs/testing";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./services/notification.service";
import { EmailWorkerService } from "./services/email-worker.service";
import { PushWorkerService } from "./services/push-worker.service";
import { FeatureFlagService } from "./services/feature-flag.service";
import { UnsubscribeRepository } from "./repositories/unsubscribe.repository";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ForbiddenException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";


const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockConfig = {
  get: jest.fn((key: string) => {
    if (key === "APPLICATION_NAME") return "Local Service Marketplace";
    if (key === "APP_URL") return "http://localhost:3000";
    return null;
  }),
};


const mockNotification = {
  id: "notif-uuid-1",
  user_id: "user-uuid-1",
  type: "request_created",
  message: "Your request was created",
  read: false,
  created_at: new Date(),
};

const mockNotifService = {
  getNotificationsByUserId: jest.fn(),
  getUnreadCount: jest.fn(),
  getTotalCount: jest.fn(),
  markAllAsRead: jest.fn(),
  getNotificationById: jest.fn(),
  markAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  sendNotification: jest.fn(),
  sendEmailDirect: jest.fn(),
  sendSmsDirect: jest.fn(),
  sendOtp: jest.fn(),
  verifyOtp: jest.fn(),
};

const mockEmailWorker = { processPendingEmails: jest.fn() };
const mockPushWorker = { processPendingPushNotifications: jest.fn() };
const mockUnsubscribeRepo = { findByEmail: jest.fn(), create: jest.fn() };

const mockFeatureFlags = {
  emailEnabled: true,
  smsEnabled: true,
  inAppNotificationsEnabled: true,
  pushNotificationsEnabled: true,
  notificationPreferencesEnabled: true,
  deviceTrackingEnabled: false,
  getEnabledChannels: jest.fn().mockReturnValue(["email", "sms", "in_app"]),
};

describe("NotificationController", () => {
  let controller: NotificationController;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Reset feature flags to enabled
    mockFeatureFlags.inAppNotificationsEnabled = true;
    mockFeatureFlags.pushNotificationsEnabled = true;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
        { provide: NotificationService, useValue: mockNotifService },
        { provide: EmailWorkerService, useValue: mockEmailWorker },
        { provide: PushWorkerService, useValue: mockPushWorker },
        { provide: UnsubscribeRepository, useValue: mockUnsubscribeRepo },
        { provide: FeatureFlagService, useValue: mockFeatureFlags },
        { provide: ConfigService, useValue: mockConfig },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  describe("getNotifications", () => {
    it("should return notifications with unread count", async () => {
      mockNotifService.getNotificationsByUserId.mockResolvedValue([
        mockNotification,
      ]);
      mockNotifService.getUnreadCount.mockResolvedValue(1);
      const result = await controller.getNotifications({ user: null } as any, "user-uuid-1", 50);
      expect(result.success).toBe(true);
      expect(result.data.notifications).toHaveLength(1);
      expect(result.data.unreadCount).toBe(1);
    });

    it("should throw BadRequestException when in-app notifications disabled", async () => {
      mockFeatureFlags.inAppNotificationsEnabled = false;
      await expect(
        controller.getNotifications({ user: null } as any, "user-uuid-1", 50),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getFeatures", () => {
    it("should return feature flags", async () => {
      const result = await controller.getFeatures();
      expect(result.data.features.email).toBe(true);
      expect(result.data.enabled_channels).toBeDefined();
    });
  });

  describe("getUnreadCount", () => {
    it("should return count", async () => {
      mockNotifService.getUnreadCount.mockResolvedValue(3);
      const result = await controller.getUnreadCount("user-uuid-1");
      expect(result.data.count).toBe(3);
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all as read", async () => {
      mockNotifService.markAllAsRead.mockResolvedValue(undefined);
      const result = await controller.markAllAsRead({ user: null } as any, "user-uuid-1");
      expect(result.message).toContain("marked as read");
    });
  });

  describe("getNotification", () => {
    it("should return a notification", async () => {
      mockNotifService.getNotificationById.mockResolvedValue(mockNotification);
      const result = await controller.getNotification(
        "notif-uuid-1",
        { user: null } as any,
        "user-uuid-1",
      );
      expect(result).toEqual(mockNotification);
    });

    it("should throw when in-app notifications disabled", async () => {
      mockFeatureFlags.inAppNotificationsEnabled = false;
      await expect(
        controller.getNotification("notif-uuid-1", { user: null } as any, "user-uuid-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const readNotif = { ...mockNotification, read: true };
      mockNotifService.markAsRead.mockResolvedValue(readNotif);
      const result = await controller.markAsRead("notif-uuid-1", { user: null } as any, "user-uuid-1");
      expect(result.read).toBe(true);
    });
  });

  describe("deleteNotification", () => {
    it("should delete notification", async () => {
      mockNotifService.deleteNotification.mockResolvedValue(undefined);
      await controller.deleteNotification("notif-uuid-1", { user: null } as any, "user-uuid-1");
      expect(mockNotifService.deleteNotification).toHaveBeenCalledWith(
        "notif-uuid-1",
        "user-uuid-1",
      );
    });
  });

  describe("sendNotification", () => {
    it("should send notification and return result", async () => {
      mockNotifService.sendNotification.mockResolvedValue({ success: true });
      const result = await controller.sendNotification({
        channel: "email" as any,
        recipient: "user@example.com",
        subject: "Test",
        message: "Hello",
      });
      expect(result.data.success).toBe(true);
    });
  });

  describe("sendEmail", () => {
    it("should send email", async () => {
      mockNotifService.sendEmailDirect.mockResolvedValue({ success: true });
      const result = await controller.sendEmail({
        to: "user@example.com",
        subject: "Test",
        message: "Hello",
      });
      expect(result.data.success).toBe(true);
    });
  });

  describe("processEmails (worker)", () => {
    it("should process emails for admin users", async () => {
      mockEmailWorker.processPendingEmails.mockResolvedValue(undefined);
      const result = await controller.processEmails();
      expect(result).toEqual({});
    });
  });

  describe("processPush (worker)", () => {
    it("should process push notifications for admin users", async () => {
      mockPushWorker.processPendingPushNotifications.mockResolvedValue(
        undefined,
      );
      const result = await controller.processPush();
      expect(result).toEqual({});
    });

    it("should throw BadRequestException when push disabled", async () => {
      mockFeatureFlags.pushNotificationsEnabled = false;
      await expect(controller.processPush()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("unsubscribe", () => {
    it("should unsubscribe new email", async () => {
      mockUnsubscribeRepo.findByEmail.mockResolvedValue(null);
      mockUnsubscribeRepo.create.mockResolvedValue({
        unsubscribed_at: new Date(),
      });
      const result = await controller.unsubscribe({
        email: "user@example.com",
        reason: "spam",
      });
      expect(result.unsubscribed).toBe(true);
    });

    it("should return existing unsubscribe record", async () => {
      const existing = { unsubscribed_at: new Date("2024-01-01") };
      mockUnsubscribeRepo.findByEmail.mockResolvedValue(existing);
      const result = await controller.unsubscribe({
        email: "user@example.com",
      } as any);
      expect(result.unsubscribed).toBe(true);
      expect(result.unsubscribed_at).toEqual(existing.unsubscribed_at);
      expect(mockUnsubscribeRepo.create).not.toHaveBeenCalled();
    });
  });
});
