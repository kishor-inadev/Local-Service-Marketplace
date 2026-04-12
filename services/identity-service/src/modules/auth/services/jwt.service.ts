import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService as NestJwtService } from "@nestjs/jwt";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  providerId?: string;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(userId: string, email: string, role: string, providerId?: string): string {
    const payload: JwtPayload = { sub: userId, email, role };
    if (providerId) payload.providerId = providerId;
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_SECRET"),
      expiresIn: this.configService.get<string>("JWT_EXPIRATION", "15m"),
    });
  }

  generateRefreshToken(userId: string, email: string, role: string, providerId?: string): string {
    const payload: JwtPayload = { sub: userId, email, role };
    if (providerId) payload.providerId = providerId;
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRATION", "7d"),
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>("JWT_SECRET"),
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
    });
  }
}
