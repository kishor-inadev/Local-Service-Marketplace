import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "../exceptions/http.exceptions";

/**
 * InternalServiceGuard
 *
 * Protects endpoints that are only meant to be called by other trusted microservices,
 * not by end users through the API Gateway.
 *
 * Caller must supply the shared secret in header:
 *   x-internal-secret: <GATEWAY_INTERNAL_SECRET>
 */
@Injectable()
export class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers["x-internal-secret"];
    const expected = process.env.GATEWAY_INTERNAL_SECRET;

    if (!expected) {
      throw new UnauthorizedException("Internal service secret not configured");
    }

    if (!secret || secret !== expected) {
      throw new UnauthorizedException("Invalid or missing internal service secret");
    }

    return true;
  }
}
