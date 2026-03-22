import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    try {
      const client = context.switchToWs().getClient();
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn('WebSocket connection rejected: No token provided');
        throw new WsException('Unauthorized: No token provided');
      }

      // TODO: Implement proper JWT validation here
      // For now, we just check if token exists
      // In production, validate the token and attach user to client

      return true;
    } catch (error) {
      this.logger.error(`WebSocket auth error: ${error.message}`);
      throw new WsException('Unauthorized');
    }
  }
}
