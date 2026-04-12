import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { JwtService } from "./services/jwt.service";
import { TokenService } from "./services/token.service";
import { UserRepository } from "./repositories/user.repository";
import { SessionRepository } from "./repositories/session.repository";
import { EmailVerificationTokenRepository } from "./repositories/email-verification-token.repository";
import { PasswordResetTokenRepository } from "./repositories/password-reset-token.repository";
import { LoginAttemptRepository } from "./repositories/login-attempt.repository";
import { SocialAccountRepository } from "./repositories/social-account.repository";
import { TwoFactorSecretRepository } from "./repositories/two-factor-secret.repository";
import { MagicLinkTokenRepository } from "./repositories/magic-link-token.repository";
import { LoginHistoryRepository } from "./repositories/login-history.repository";
import { AccountDeletionRequestRepository } from "./repositories/account-deletion-request.repository";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { BlacklistGuard } from "./guards/blacklist.guard";
import { TokenBlacklistService } from "./services/token-blacklist.service";
import { GoogleStrategy } from "./strategies/google.strategy";
import { FacebookStrategy } from "./strategies/facebook.strategy";
import { SmsClient } from "./clients/sms.client";
import { ProviderRepository } from "../user/repositories/provider.repository";
import { NotificationModule } from "../../common/notification/notification.module";

// Dynamic providers - only include OAuth strategies if credentials are configured
const createOAuthProviders = (configService: ConfigService) => {
  const providers = [];

  // Only add Google strategy if credentials exist
  if (
    configService.get<string>("GOOGLE_CLIENT_ID") &&
    configService.get<string>("GOOGLE_CLIENT_SECRET")
  ) {
    providers.push(GoogleStrategy);
  }

  // Only add Facebook strategy if credentials exist
  if (
    configService.get<string>("FACEBOOK_APP_ID") &&
    configService.get<string>("FACEBOOK_APP_SECRET")
  ) {
    providers.push(FacebookStrategy);
  }

  return providers;
};

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'identity.notification' },
    ),
    NotificationModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>("JWT_SECRET");
        if (!secret) {
          throw new Error(
            "JWT_SECRET environment variable is required but not set",
          );
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>("JWT_EXPIRATION", "15m"),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    TokenService,
    TokenBlacklistService,
    UserRepository,
    SessionRepository,
    EmailVerificationTokenRepository,
    PasswordResetTokenRepository,
    LoginAttemptRepository,
    SocialAccountRepository,
    TwoFactorSecretRepository,
    MagicLinkTokenRepository,
    LoginHistoryRepository,
    AccountDeletionRequestRepository,
    ProviderRepository,
    JwtAuthGuard,
    BlacklistGuard,
    SmsClient,
    // Conditionally provide Google OAuth strategy
    {
      provide: "GOOGLE_STRATEGY",
      useFactory: (configService: ConfigService) => {
        const clientId = configService.get<string>("GOOGLE_CLIENT_ID");
        const clientSecret = configService.get<string>("GOOGLE_CLIENT_SECRET");

        if (clientId && clientSecret) {
          return new GoogleStrategy(configService);
        }
        return null; // OAuth not configured
      },
      inject: [ConfigService],
    },
    // Conditionally provide Facebook OAuth strategy
    {
      provide: "FACEBOOK_STRATEGY",
      useFactory: (configService: ConfigService) => {
        const appId = configService.get<string>("FACEBOOK_APP_ID");
        const appSecret = configService.get<string>("FACEBOOK_APP_SECRET");

        if (appId && appSecret) {
          return new FacebookStrategy(configService);
        }
        return null; // OAuth not configured
      },
      inject: [ConfigService],
    },
  ],
  exports: [JwtService, JwtAuthGuard, BlacklistGuard, TokenBlacklistService],
})
export class AuthModule {}
