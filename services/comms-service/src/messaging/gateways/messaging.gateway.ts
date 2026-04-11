import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, Logger, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { MessageService } from "../services/message.service";
import { CreateMessageDto } from "../dto/create-message.dto";
import { WsAuthGuard } from "./ws-auth.guard";

type AuthenticatedSocket = Socket & {
  userId?: string;
};

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: "/messaging",
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private readonly userSockets: Map<string, Set<string>> = new Map();
  private readonly jwtSecret: string;

  constructor(
    private readonly messageService: MessageService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>("JWT_SECRET", "");
  }

  afterInit(server: Server) {
    this.logger.log("WebSocket Gateway initialized");
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth or query params
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT signature and expiration
      const payload = this.verifyJwt(token as string);
      if (!payload) {
        this.logger.warn(`Connection rejected: Invalid or expired token`);
        client.disconnect();
        return;
      }

      const userId = payload.userId || payload.sub;

      if (!userId) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      client.userId = userId;

      // Track user's socket connections
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join user's personal room
      client.join(`user:${userId}`);

      this.logger.log(
        `Client connected: ${client.id}, User: ${userId}, Total connections: ${this.userSockets.get(userId)!.size}`,
      );

      // Notify user is online
      this.server.emit("user:online", { userId });
    } catch (error: any) {
      this.logger.error(`Connection error: ${error.message}`, error.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId;

    if (userId && this.userSockets.has(userId)) {
      const userConnections = this.userSockets.get(userId)!;
      userConnections.delete(client.id);

      this.logger.log(
        `Client disconnected: ${client.id}, User: ${userId}, Remaining connections: ${userConnections.size}`,
      );

      // If user has no more connections, mark as offline
      if (userConnections.size === 0) {
        this.userSockets.delete(userId);
        this.server.emit("user:offline", { userId });
        this.logger.log(`User ${userId} is now offline`);
      }
    }
  }

  /**
   * Handle new message sent via WebSocket
   */
  @SubscribeMessage("message:send")
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: CreateMessageDto,
  ) {
    try {
      const senderId = client.userId;

      if (!senderId) {
        return { error: "Unauthorized" };
      }

      this.logger.log(
        `Message sent via WS from ${senderId} for job ${data.job_id}`,
      );

      // Create message using the existing service (3 separate parameters)
      const message = await this.messageService.createMessage(
        data.job_id,
        senderId,
        data.message,
      );

      // Emit to sender's sockets (for multi-device sync)
      this.server.to(`user:${senderId}`).emit("message:sent", message);

      // Emit to all users in the job room
      this.server.to(`job:${data.job_id}`).emit("message:received", message);

      return { success: true, message };
    } catch (error: any) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
      return { error: error.message };
    }
  }

  /**
   * Handle typing indicator
   */
  @SubscribeMessage("message:typing")
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId: string; isTyping: boolean },
  ) {
    const senderId = client.userId;

    if (!senderId) {
      return { error: "Unauthorized" };
    }

    // Notify receiver that sender is typing
    this.server
      .to(`user:${data.receiverId}`)
      .emit("message:typing", { senderId, isTyping: data.isTyping });

    return { success: true };
  }

  /**
   * Handle message read receipt
   */
  @SubscribeMessage("message:read")
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const userId = client.userId;

      if (!userId) {
        return { error: "Unauthorized" };
      }

      // Get the message to verify and notify sender
      const message = await this.messageService.getMessageById(data.messageId);

      // Notify sender that message was read
      this.server.to(`user:${message.sender_id}`).emit("message:read", {
        messageId: data.messageId,
        readBy: userId,
        readAt: new Date(),
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(
        `Error marking message as read: ${error.message}`,
        error.stack,
      );
      return { error: error.message };
    }
  }

  /**
   * Join a conversation room for group chat support (future)
   */
  @SubscribeMessage("conversation:join")
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.userId;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    await client.join(`conversation:${data.conversationId}`);
    this.logger.log(
      `User ${userId} joined conversation ${data.conversationId}`,
    );

    return { success: true };
  }

  /**
   * Leave a conversation room
   */
  @SubscribeMessage("conversation:leave")
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.userId;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    await client.leave(`conversation:${data.conversationId}`);
    this.logger.log(`User ${userId} left conversation ${data.conversationId}`);

    return { success: true };
  }

  /**
   * Check online status of users
   */
  @SubscribeMessage("users:getOnlineStatus")
  handleGetOnlineStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userIds: string[] },
  ) {
    const userId = client.userId;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    const onlineStatus: Record<string, boolean> = {};

    for (const targetUserId of data.userIds) {
      onlineStatus[targetUserId] = this.userSockets.has(targetUserId);
    }

    return { success: true, onlineStatus };
  }

  /**
   * Verify JWT token signature and expiration
   */
  private verifyJwt(token: string): any {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, signatureB64] = parts;

      if (!this.jwtSecret) {
        this.logger.error("JWT_SECRET not configured");
        return null;
      }

      // Verify HMAC-SHA256 signature
      const signatureInput = `${headerB64}.${payloadB64}`;
      const expectedSig = crypto
        .createHmac("sha256", this.jwtSecret)
        .update(signatureInput)
        .digest("base64url");

      if (expectedSig !== signatureB64) {
        this.logger.warn("JWT signature verification failed");
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(payloadB64, "base64url").toString(),
      );

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        this.logger.warn("JWT token expired");
        return null;
      }

      return payload;
    } catch (error: any) {
      this.logger.error(`JWT verification error: ${error.message}`);
      return null;
    }
  }

  /**
   * Emit message to specific user (callable from MessageService)
   */
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get specific user's connection count
   */
  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }
}
