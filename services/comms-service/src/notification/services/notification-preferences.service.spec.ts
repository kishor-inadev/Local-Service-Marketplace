import { Test, TestingModule } from "@nestjs/testing";
import { NotificationPreferencesService } from "./notification-preferences.service";
import { NotificationPreferencesRepository } from "../repositories/notification-preferences.repository";

const mockPrefs = {
  id: "pref-uuid-1",
  user_id: "user-uuid-1",
  email_notifications: true,
  sms_notifications: true,
  push_notifications: true,
  marketing_emails: false,
  new_request_alerts: true,
  proposal_alerts: true,
  job_updates: true,
  payment_alerts: true,
  review_alerts: true,
  message_alerts: true,
};

const mockRepo = {
  findByUserId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  getUsersWithPreference: jest.fn(),
};

describe("NotificationPreferencesService", () => {
  let service: NotificationPreferencesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferencesService,
        { provide: NotificationPreferencesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<NotificationPreferencesService>(
      NotificationPreferencesService,
    );
  });

  describe("createDefaultPreferences", () => {
    it("should create defaults for new user", async () => {
      mockRepo.create.mockResolvedValue(mockPrefs);
      const result = await service.createDefaultPreferences("user-uuid-1");
      expect(mockRepo.create).toHaveBeenCalledWith("user-uuid-1");
      expect(result).toEqual(mockPrefs);
    });
  });

  describe("getPreferences", () => {
    it("should return existing preferences", async () => {
      mockRepo.findByUserId.mockResolvedValue(mockPrefs);
      const result = await service.getPreferences("user-uuid-1");
      expect(result).toEqual(mockPrefs);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should create defaults if none exist", async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockPrefs);
      const result = await service.getPreferences("user-uuid-1");
      expect(mockRepo.create).toHaveBeenCalledWith("user-uuid-1");
      expect(result).toEqual(mockPrefs);
    });
  });

  describe("updatePreferences", () => {
    it("should update preferences", async () => {
      mockRepo.findByUserId.mockResolvedValue(mockPrefs);
      const updated = { ...mockPrefs, marketing_emails: true };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.updatePreferences("user-uuid-1", {
        marketing_emails: true,
      });
      expect(mockRepo.update).toHaveBeenCalledWith("pref-uuid-1", {
        marketing_emails: true,
      });
      expect(result.marketing_emails).toBe(true);
    });
  });

  describe("checkNotificationEnabled", () => {
    it("should return true for enabled notification type", async () => {
      mockRepo.findByUserId.mockResolvedValue(mockPrefs);
      const result = await service.checkNotificationEnabled(
        "user-uuid-1",
        "email_notifications",
      );
      expect(result).toBe(true);
    });

    it("should return false for disabled notification type", async () => {
      mockRepo.findByUserId.mockResolvedValue(mockPrefs);
      const result = await service.checkNotificationEnabled(
        "user-uuid-1",
        "marketing_emails",
      );
      expect(result).toBe(false);
    });
  });

  describe("getUsersForNotification", () => {
    it("should return users with the preference enabled", async () => {
      mockRepo.getUsersWithPreference.mockResolvedValue([mockPrefs]);
      const result = await service.getUsersForNotification(
        "email_notifications",
      );
      expect(mockRepo.getUsersWithPreference).toHaveBeenCalledWith(
        "email_notifications",
        true,
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("disableAllNotifications", () => {
    it("should set all notification flags to false", async () => {
      mockRepo.findByUserId.mockResolvedValue(mockPrefs);
      const disabled = {
        ...mockPrefs,
        email_notifications: false,
        sms_notifications: false,
      };
      mockRepo.update.mockResolvedValue(disabled);

      const result = await service.disableAllNotifications("user-uuid-1");
      const updateArg = mockRepo.update.mock.calls[0][1];
      expect(updateArg.email_notifications).toBe(false);
      expect(updateArg.sms_notifications).toBe(false);
      expect(updateArg.push_notifications).toBe(false);
      expect(updateArg.marketing_emails).toBe(false);
    });
  });

  describe("enableAllNotifications", () => {
    it("should set all notification flags to true", async () => {
      mockRepo.findByUserId.mockResolvedValue(mockPrefs);
      const enabled = { ...mockPrefs, marketing_emails: true };
      mockRepo.update.mockResolvedValue(enabled);

      const result = await service.enableAllNotifications("user-uuid-1");
      const updateArg = mockRepo.update.mock.calls[0][1];
      expect(updateArg.email_notifications).toBe(true);
      expect(updateArg.sms_notifications).toBe(true);
      expect(updateArg.push_notifications).toBe(true);
      expect(updateArg.marketing_emails).toBe(true);
    });
  });
});
