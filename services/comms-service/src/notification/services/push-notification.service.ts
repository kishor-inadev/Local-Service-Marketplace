import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import * as admin from "firebase-admin";

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  deviceToken?: string;
}

/**
 * PushNotificationService - Firebase Cloud Messaging (FCM) integration
 * 
 * Supports both FCM (Android/Web) and APNs (iOS via FCM)
 * 
 * Environment Variables:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_PRIVATE_KEY (base64 encoded or raw)
 * - FIREBASE_CLIENT_EMAIL
 * - FCM_ENABLED (default: false)
 */
@Injectable()
export class PushNotificationService {
  private fcmEnabled: boolean;
  private fcmApp: admin.app.App | null = null;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    this.fcmEnabled = process.env.FCM_ENABLED === "true";
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    if (!this.fcmEnabled) {
      this.logger.warn(
        "FCM is disabled (FCM_ENABLED=false). Push notifications will be logged only.",
        "PushNotificationService",
      );
      return;
    }

    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn(
          "Firebase credentials not configured. Missing FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, or FIREBASE_CLIENT_EMAIL. Push notifications will be mocked.",
          "PushNotificationService",
        );
        this.fcmEnabled = false;
        return;
      }

      // Decode private key if it's base64 encoded
      const decodedPrivateKey = privateKey.includes("\\n")
        ? privateKey
        : Buffer.from(privateKey, "base64").toString("utf8");

      this.fcmApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: decodedPrivateKey.replace(/\\n/g, "\n"),
          clientEmail,
        }),
      });

      this.logger.log(
        "Firebase Cloud Messaging initialized successfully",
        "PushNotificationService",
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to initialize Firebase: ${error.message}`,
        error.stack,
        "PushNotificationService",
      );
      this.fcmEnabled = false;
    }
  }

  /**
   * Send push notification to a user
   * 
   * @param payload - Notification payload
   * @returns true if sent successfully, false otherwise
   */
  async sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
    const { userId, title, body, data, deviceToken } = payload;

    if (!this.fcmEnabled) {
      this.logger.log(
        `[MOCK] Push notification for user ${userId}: ${title} - ${body}`,
        "PushNotificationService",
      );
      return true; // Mock success
    }

    try {
      // TODO: Fetch device token from database if not provided
      // For now, we require it to be passed or fail gracefully
      if (!deviceToken) {
        this.logger.warn(
          `No device token available for user ${userId}. Push notification skipped.`,
          "PushNotificationService",
        );
        return false;
      }

      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token: deviceToken,
        // Apple Push Notification Service (APNs) config
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body,
              },
              sound: "default",
              badge: 1,
            },
          },
        },
        // Android config
        android: {
          priority: "high",
          notification: {
            sound: "default",
            clickAction: "FLUTTER_NOTIFICATION_CLICK",
          },
        },
      };

      const response = await admin.messaging(this.fcmApp).send(message);

      this.logger.log(
        `Push notification sent successfully for user ${userId}: ${response}`,
        "PushNotificationService",
      );

      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to send push notification for user ${userId}: ${error.message}`,
        error.stack,
        "PushNotificationService",
      );
      return false;
    }
  }

  /**
   * Send push notification to multiple devices
   * 
   * @param payload - Notification payload
   * @param deviceTokens - Array of device tokens
   * @returns Count of successfully sent notifications
   */
  async sendMulticastPushNotification(
    payload: Omit<PushNotificationPayload, "deviceToken">,
    deviceTokens: string[],
  ): Promise<number> {
    if (!this.fcmEnabled) {
      this.logger.log(
        `[MOCK] Multicast push notification for ${deviceTokens.length} devices: ${payload.title}`,
        "PushNotificationService",
      );
      return deviceTokens.length; // Mock success
    }

    try {
      if (deviceTokens.length === 0) {
        this.logger.warn(
          "No device tokens provided for multicast notification",
          "PushNotificationService",
        );
        return 0;
      }

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        tokens: deviceTokens,
      };

      const response = await admin.messaging(this.fcmApp).sendEachForMulticast(message);

      this.logger.log(
        `Multicast notification sent: ${response.successCount}/${deviceTokens.length} successful`,
        "PushNotificationService",
      );

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.warn(
              `Failed to send to device ${deviceTokens[idx]}: ${resp.error?.message}`,
              "PushNotificationService",
            );
          }
        });
      }

      return response.successCount;
    } catch (error: any) {
      this.logger.error(
        `Failed to send multicast push notification: ${error.message}`,
        error.stack,
        "PushNotificationService",
      );
      return 0;
    }
  }

  /**
   * Check if FCM is enabled and initialized
   */
  isEnabled(): boolean {
    return this.fcmEnabled;
  }
}
