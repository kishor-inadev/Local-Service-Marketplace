import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";

export interface TrackEventOptions {
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

/**
 * AnalyticsClient — fire-and-forget analytics event tracking.
 *
 * When Kafka is disabled (EVENT_BUS_ENABLED=false), services send events
 * directly to oversight-service via the internal HTTP endpoint
 * POST /analytics/internal/track, authenticated with GATEWAY_INTERNAL_SECRET.
 *
 * When Kafka is enabled, the Kafka EventConsumerService in oversight-service
 * handles the same events, so calls here are skipped to avoid duplicates.
 *
 * All calls are fire-and-forget — failures are logged but never thrown
 * so analytics errors never impact business logic.
 */
@Injectable()
export class AnalyticsClient {
  private readonly logger = new Logger(AnalyticsClient.name);
  private readonly client: AxiosInstance;
  private readonly enabled: boolean;
  private readonly kafkaEnabled: boolean;

  constructor(private configService: ConfigService) {
    const analyticsServiceUrl = this.configService.get<string>(
      "ANALYTICS_SERVICE_URL",
      "http://oversight-service:3010",
    );
    this.enabled =
      this.configService.get<string>("ANALYTICS_ENABLED", "true") === "true";
    this.kafkaEnabled =
      this.configService.get<string>("EVENT_BUS_ENABLED", "false") === "true";

    const internalSecret = this.configService.get<string>(
      "GATEWAY_INTERNAL_SECRET",
      "",
    );

    this.client = axios.create({
      baseURL: analyticsServiceUrl,
      timeout: 3000, // Fast timeout — analytics must never block the main flow
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": internalSecret,
      },
    });
  }

  /**
   * Track a business event. Always fire-and-forget — never throws.
   */
  async track(options: TrackEventOptions): Promise<void> {
    if (!this.enabled) return;
    // When Kafka is enabled, EventConsumerService in oversight-service already
    // processes these events — skip HTTP call to avoid double-counting.
    if (this.kafkaEnabled) return;

    try {
      await this.client.post("/analytics/internal/track", {
        user_id: options.userId,
        action: options.action,
        resource: options.resource,
        resource_id: options.resourceId,
        metadata: options.metadata,
        ip_address: options.ipAddress,
      });
    } catch (error) {
      // Intentional fire-and-forget — analytics failures must never surface to users
      this.logger.warn(
        `Analytics track failed for action "${options.action}": ${error?.message}`,
        AnalyticsClient.name,
      );
    }
  }
}
