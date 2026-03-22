import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    try {
      // Decode JWT token (Base64 decode the payload)
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException('Invalid token format');
      }

      // Decode the payload (second part)
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );

      // Attach user info to request
      // The payload should contain: { sub: userId, email, role, iat, exp }
      request.user = {
        id: payload.sub || payload.id || payload.user_id,
        email: payload.email,
        role: payload.role,
        sub: payload.sub,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
