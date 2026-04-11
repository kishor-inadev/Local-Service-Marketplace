import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { TokenBlacklistService } from "../services/token-blacklist.service";

/**
 * BlacklistGuard - Checks if JWT token is revoked
 * 
 * Should be used AFTER JwtAuthGuard to validate decoded token
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, BlacklistGuard)
 * 
 * Checks:
 * 1. Individual token revocation
 * 2. User-level revocation (all tokens for user)
 */
@Injectable()
export class BlacklistGuard implements CanActivate {
  constructor(private readonly blacklistService: TokenBlacklistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("No token provided");
    }
    
    const token = authHeader.substring(7); // Remove "Bearer "
    
    // Check if token is individually blacklisted
    const isTokenRevoked = await this.blacklistService.isTokenRevoked(token);
    if (isTokenRevoked) {
      throw new UnauthorizedException("Token has been revoked");
    }
    
    // Check if all user tokens are revoked
    const user = request.user; // Set by JwtAuthGuard
    if (user && user.userId && user.iat) {
      const areUserTokensRevoked =
        await this.blacklistService.areUserTokensRevoked(
          user.userId,
          user.iat * 1000, // Convert to milliseconds
        );
      
      if (areUserTokensRevoked) {
        throw new UnauthorizedException(
          "All tokens for this user have been revoked",
        );
      }
    }
    
    return true;
  }
}
