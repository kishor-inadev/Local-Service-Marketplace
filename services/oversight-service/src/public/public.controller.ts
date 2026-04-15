import { Controller, Get } from "@nestjs/common";
import { SystemSettingService } from "../admin/services/system-setting.service";

/**
 * Public (unauthenticated) endpoints exposed by the oversight-service.
 * Used by api-gateway and other internal services that cannot pass admin JWT.
 */
@Controller("public")
export class PublicController {
  constructor(private readonly systemSettingService: SystemSettingService) {}

  /**
   * Returns the current maintenance mode status.
   * Called by the api-gateway middleware with a 60-second TTL cache.
   * No authentication required.
   */
  @Get("maintenance-status")
  async getMaintenanceStatus() {
    const [modeResult, msgResult] = await Promise.allSettled([
      this.systemSettingService.getSettingByKey("maintenance_mode"),
      this.systemSettingService.getSettingByKey("maintenance_message"),
    ]);

    const maintenanceMode =
      modeResult.status === "fulfilled" && modeResult.value?.value === "true";
    const maintenanceMessage =
      msgResult.status === "fulfilled"
        ? (msgResult.value?.value ?? "")
        : "";

    return {
      maintenance_mode: maintenanceMode,
      maintenance_message: maintenanceMessage,
    };
  }

  /**
   * Returns rate-limit configuration values for the api-gateway.
   * Called by the gateway RateLimitConfigService with a 60-second TTL cache.
   * No authentication required.
   */
  @Get("rate-limit-config")
  async getRateLimitConfig() {
    const keys = [
      "rate_limit_max_requests",
      "auth_rate_limit_max_requests",
      "rate_limit_window_ms",
    ];
    const results = await Promise.allSettled(
      keys.map((k) => this.systemSettingService.getSettingByKey(k)),
    );

    const getValue = (i: number, fallback: string) =>
      results[i].status === "fulfilled"
        ? ((results[i] as PromiseFulfilledResult<any>).value?.value ?? fallback)
        : fallback;

    return {
      rate_limit_max_requests: parseInt(getValue(0, "500"), 10) || 500,
      auth_rate_limit_max_requests: parseInt(getValue(1, "10"), 10) || 10,
      rate_limit_window_ms: parseInt(getValue(2, "60000"), 10) || 60000,
    };
  }

  /**
   * Returns publicly-needed site-wide configuration values in one call.
   * Used by the Next.js frontend (server-side fetch + client hook) so that
   * contact info, upload limits, GST rate, platform fee, etc. are always
   * driven from the database rather than hardcoded in the UI.
   * No authentication required.
   */
  @Get("site-config")
  async getSiteConfig() {
    const keys = [
      "support_email",
      "contact_phone",
      "contact_address",
      "max_file_upload_size_mb",
      "allowed_file_types",
      "gst_rate",
      "platform_fee_percentage",
      "default_currency",
      "default_page_limit",
    ];

    const results = await Promise.allSettled(
      keys.map((k) => this.systemSettingService.getSettingByKey(k)),
    );

    const get = (i: number, fallback: string) =>
      results[i].status === "fulfilled"
        ? ((results[i] as PromiseFulfilledResult<any>).value?.value ?? fallback)
        : fallback;

    return {
      supportEmail:          get(0, "support@marketplace.com"),
      contactPhone:          get(1, ""),
      contactAddress:        get(2, ""),
      maxFileUploadSizeMb:   parseInt(get(3, "10"), 10)   || 10,
      allowedFileTypes:      get(4, "image/jpeg,image/png,image/webp,application/pdf"),
      gstRate:               parseFloat(get(5, "18"))     || 18,
      platformFeePercentage: parseFloat(get(6, "15"))     || 15,
      currency:              get(7, "INR"),
      defaultPageLimit:      parseInt(get(8, "20"), 10)   || 20,
    };
  }
}