import { BadRequestException } from "@nestjs/common";
import { FeatureFlagService } from "./feature-flag.service";

describe("FeatureFlagService", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function createService(
    envOverrides: Record<string, string> = {},
  ): FeatureFlagService {
    process.env = { ...originalEnv, ...envOverrides };
    return new FeatureFlagService();
  }

  describe("constructor defaults", () => {
    it("should enable email by default and disable others", () => {
      const svc = createService({});
      expect(svc.emailEnabled).toBe(true);
      expect(svc.smsEnabled).toBe(false);
      expect(svc.inAppNotificationsEnabled).toBe(false);
      expect(svc.pushNotificationsEnabled).toBe(false);
      expect(svc.notificationPreferencesEnabled).toBe(false);
      expect(svc.deviceTrackingEnabled).toBe(false);
    });

    it("should disable email when EMAIL_ENABLED=false", () => {
      const svc = createService({ EMAIL_ENABLED: "false" });
      expect(svc.emailEnabled).toBe(false);
    });

    it("should enable SMS when SMS_ENABLED=true", () => {
      const svc = createService({ SMS_ENABLED: "true" });
      expect(svc.smsEnabled).toBe(true);
    });

    it("should enable all features when env vars set", () => {
      const svc = createService({
        EMAIL_ENABLED: "true",
        SMS_ENABLED: "true",
        IN_APP_NOTIFICATIONS_ENABLED: "true",
        PUSH_NOTIFICATIONS_ENABLED: "true",
        NOTIFICATION_PREFERENCES_ENABLED: "true",
        DEVICE_TRACKING_ENABLED: "true",
      });
      expect(svc.emailEnabled).toBe(true);
      expect(svc.smsEnabled).toBe(true);
      expect(svc.inAppNotificationsEnabled).toBe(true);
      expect(svc.pushNotificationsEnabled).toBe(true);
      expect(svc.notificationPreferencesEnabled).toBe(true);
      expect(svc.deviceTrackingEnabled).toBe(true);
    });
  });

  describe("isFeatureEnabled", () => {
    it("should return true for enabled features", () => {
      const svc = createService({ SMS_ENABLED: "true" });
      expect(svc.isFeatureEnabled("email")).toBe(true);
      expect(svc.isFeatureEnabled("sms")).toBe(true);
    });

    it("should return false for disabled features", () => {
      const svc = createService({});
      expect(svc.isFeatureEnabled("sms")).toBe(false);
      expect(svc.isFeatureEnabled("push")).toBe(false);
      expect(svc.isFeatureEnabled("in_app")).toBe(false);
      expect(svc.isFeatureEnabled("preferences")).toBe(false);
      expect(svc.isFeatureEnabled("device_tracking")).toBe(false);
    });

    it("should return false for unknown features", () => {
      const svc = createService({});
      expect(svc.isFeatureEnabled("unknown")).toBe(false);
    });
  });

  describe("getEnabledChannels", () => {
    it("should return only email by default", () => {
      const svc = createService({});
      expect(svc.getEnabledChannels()).toEqual(["email"]);
    });

    it("should list all enabled channels", () => {
      const svc = createService({
        SMS_ENABLED: "true",
        PUSH_NOTIFICATIONS_ENABLED: "true",
        IN_APP_NOTIFICATIONS_ENABLED: "true",
      });
      const channels = svc.getEnabledChannels();
      expect(channels).toContain("email");
      expect(channels).toContain("sms");
      expect(channels).toContain("push");
      expect(channels).toContain("in_app");
    });
  });

  describe("checkFeatureOrThrow", () => {
    it("should not throw when feature is enabled", () => {
      const svc = createService({});
      expect(() => svc.checkFeatureOrThrow("email", "Email")).not.toThrow();
    });

    it("should throw BadRequestException when feature is disabled", () => {
      const svc = createService({});
      expect(() => svc.checkFeatureOrThrow("sms", "SMS")).toThrow(
        BadRequestException,
      );
    });

    it("should include feature name in error message", () => {
      const svc = createService({});
      expect(() =>
        svc.checkFeatureOrThrow("push", "Push notifications"),
      ).toThrow(/Push notifications is disabled/);
    });
  });
});
