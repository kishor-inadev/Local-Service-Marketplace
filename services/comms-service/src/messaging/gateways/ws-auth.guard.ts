import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WsException } from "@nestjs/websockets";
import * as crypto from "crypto";

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);
  private readonly jwtSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.jwtSecret = this.configService.get<string>("JWT_SECRET", "");
    if (!this.jwtSecret) {
      this.logger.error(
        "JWT_SECRET is not configured — WebSocket auth will reject all connections",
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    try {
      const client = context.switchToWs().getClient();
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn("WebSocket connection rejected: No token provided");
        throw new WsException("Unauthorized: No token provided");
      }

      if (!this.jwtSecret) {
        throw new WsException("Server misconfiguration");
      }

      const payload = this.verifyJwt(token as string);
      if (!payload) {
        throw new WsException("Unauthorized: Invalid token");
      }

      // Attach verified user info to the client for downstream use
      client.userId = payload.userId || payload.sub;

      return true;
    } catch (error) {
      if (error instanceof WsException) throw error;
      this.logger.error(`WebSocket auth error: ${error.message}`);
      throw new WsException("Unauthorized");
    }
  }

  private verifyJwt(token: string): any {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, signatureB64] = parts;

      // Verify HMAC-SHA256 signature
      const signatureInput = `${headerB64}.${payloadB64}`;
      const expectedSig = crypto
        .createHmac("sha256", this.jwtSecret)
        .update(signatureInput)
        .digest("base64url");

      if (expectedSig !== signatureB64) {
        this.logger.warn("WebSocket JWT signature verification failed");
        return null;
      }

      // Decode and validate payload
      const payload = JSON.parse(
        Buffer.from(payloadB64, "base64url").toString(),
      );

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        this.logger.warn("WebSocket JWT token expired");
        return null;
      }

      return payload;
    } catch (error) {
      this.logger.error(`JWT verification error: ${error.message}`);
      return null;
    }
  }
}
