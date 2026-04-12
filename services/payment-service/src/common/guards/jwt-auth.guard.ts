import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "../exceptions/http.exceptions";
import * as crypto from "crypto";

/**
 * JWT Auth Guard for microservices
 *
 * This guard extracts user information from headers that are injected
 * by the API Gateway after JWT validation.
 *
 * The API Gateway validates the JWT token and injects user context headers:
 * - x-user-id: User's unique identifier
 * - x-user-email: User's email
 * - x-user-role: User's role (customer, provider, admin)
 * - x-user-name: User's name (optional)
 * - x-user-phone: User's phone (optional)
 * - x-provider-id: Provider ID if user is a provider (optional)
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract user context from headers (injected by API Gateway)
    const userId = request.headers["x-user-id"];
    const userEmail = request.headers["x-user-email"];
    const userRole = request.headers["x-user-role"];

    // If no user context headers, request didn't come through gateway or user not authenticated
    if (!userId || !userEmail) {
      throw new UnauthorizedException(
        "Authentication required. Request must come through API Gateway.",
      );
    }

    // Verify HMAC signature to ensure headers were set by the gateway
    const gatewaySecret = process.env.GATEWAY_INTERNAL_SECRET;
    if (gatewaySecret) {
      const receivedHmac = request.headers["x-gateway-hmac"];
      const providerId = request.headers["x-provider-id"] || "none";
      const hmacPayload = `${userId}:${userEmail}:${userRole || "user"}:${providerId}`;
      const expectedHmac = crypto
        .createHmac("sha256", gatewaySecret)
        .update(hmacPayload)
        .digest("hex");
      const receivedBuf = Buffer.from(receivedHmac ?? "", "utf8");
      const expectedBuf = Buffer.from(expectedHmac, "utf8");
      const isValid =
        receivedBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(receivedBuf, expectedBuf);
      if (!receivedHmac || !isValid) {
        throw new UnauthorizedException("Invalid gateway signature.");
      }
    } else if (process.env.NODE_ENV === "production") {
      throw new UnauthorizedException(
        "Server misconfiguration: gateway secret not set.",
      );
    }

    // Attach user info to request object for use in controllers/services
    request.user = {
      userId,
      email: userEmail,
      role: userRole || "customer",
      name: request.headers["x-user-name"],
      phone: request.headers["x-user-phone"],
      providerId: request.headers["x-provider-id"],
    };

    return true;
  }
}
