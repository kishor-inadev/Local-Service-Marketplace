import { Injectable, Inject } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { verifySync } from "otplib";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { UserRepository } from "../repositories/user.repository";
import { SessionRepository } from "../repositories/session.repository";
import { LoginAttemptRepository } from "../repositories/login-attempt.repository";
import { SocialAccountRepository } from "../repositories/social-account.repository";
import { TwoFactorSecretRepository } from "../repositories/two-factor-secret.repository";
import { MagicLinkTokenRepository } from "../repositories/magic-link-token.repository";
import { LoginHistoryRepository } from "../repositories/login-history.repository";
import { AccountDeletionRequestRepository } from "../repositories/account-deletion-request.repository";
import { ProviderRepository } from "../../user/repositories/provider.repository";
import { JwtService } from "./jwt.service";
import { TokenService } from "./token.service";
import { SmsClient } from "../clients/sms.client";
import { NotificationClient } from "../../../common/notification/notification.client";
import { SignupDto } from "../dto/signup.dto";
import { RegisterDto, RegisterResponseDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { AuthResponseDto } from "../dto/auth-response.dto";
import { OAuthUserDto } from "../dto/oauth-user.dto";
import { UpdateUserDto } from "../../user/dto/update-user.dto";
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  TooManyRequestsException,
  NotFoundException,
} from "@/common/exceptions/http.exceptions";

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;
  private readonly maxLoginAttempts: number;
  private readonly workersEnabled = process.env.WORKERS_ENABLED === 'true';

  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly loginAttemptRepo: LoginAttemptRepository,
    private readonly socialAccountRepo: SocialAccountRepository,
    private readonly twoFactorSecretRepo: TwoFactorSecretRepository,
    private readonly magicLinkTokenRepo: MagicLinkTokenRepository,
    private readonly loginHistoryRepo: LoginHistoryRepository,
    private readonly accountDeletionRequestRepo: AccountDeletionRequestRepository,
    private readonly providerRepo: ProviderRepository,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly smsClient: SmsClient,
    private readonly notificationClient: NotificationClient,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @InjectQueue('identity.notification') private readonly notificationQueue: Queue,
  ) {
    this.maxLoginAttempts = parseInt(
      this.configService.get<string>("MAX_LOGIN_ATTEMPTS", "5"),
      10,
    );
  }

  /**
   * Resolves the provider entity ID for a user whose role is 'provider'.
   * Returns undefined for non-providers or when no provider record exists yet.
   */
  private async resolveProviderId(userId: string, role: string): Promise<string | undefined> {
    if (role !== "provider") return undefined;
    const provider = await this.providerRepo.findByUserId(userId).catch(() => null);
    return provider?.id ?? undefined;
  }

  private generatePassword(length = 12): string {
    const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const digits = "23456789";
    const special = "!@#$%^&*";
    const all = upper + lower + digits + special;

    // Guarantee at least one of each required category
    const guaranteed = [
      upper.charAt(Math.floor(Math.random() * upper.length)),
      lower.charAt(Math.floor(Math.random() * lower.length)),
      digits.charAt(Math.floor(Math.random() * digits.length)),
      special.charAt(Math.floor(Math.random() * special.length)),
    ];

    const remaining: string[] = [];
    for (let i = guaranteed.length; i < length; i++) {
      remaining.push(all.charAt(Math.floor(Math.random() * all.length)));
    }

    // Shuffle all characters to avoid predictable positions
    const combined = [...guaranteed, ...remaining];
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined.join("");
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, phone, name, userType: role = "customer" } = registerDto;

    if (!email && !phone) {
      throw new BadRequestException("Either email or phone is required");
    }

    this.logger.info("Register attempt", {
      context: "AuthService",
      email,
      phone,
      role,
    });

    // Check for duplicate email
    if (email) {
      const existingByEmail = await this.userRepo.findByEmail(email);
      if (existingByEmail) {
        throw new ConflictException("A user with this email already exists");
      }
    }

    // Check for duplicate phone
    if (phone) {
      const existingByPhone = await this.userRepo.findByPhone(phone);
      if (existingByPhone) {
        throw new ConflictException(
          "A user with this phone number already exists",
        );
      }
    }

    // Auto-generate password if not provided
    const passwordWasGenerated = !registerDto.password;
    const rawPassword = registerDto.password || this.generatePassword(8);
    const passwordHash = await bcrypt.hash(rawPassword, this.saltRounds);

    // Create user (no auto-login)
    const user = await this.userRepo.create(
      email,
      passwordHash,
      role,
      phone,
      name,
    );

    // Generate email verification token
    const verificationToken =
      await this.tokenService.createEmailVerificationToken(user.id);

    const frontendUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:3000",
    );
    const displayName = name || (email ? email.split("@")[0] : phone);
    let emailSent = false;
    let verificationEmailSent = false;

    if (email) {
      // Send generated password email (non-blocking)
      if (passwordWasGenerated) {
        const passwordPayload = {
          to: email,
          template: 'MARKETPLACE_WELCOME',
          variables: {
            name: displayName,
            email,
            dashboardUrl: `${frontendUrl}/dashboard`,
          },
        };
        const passwordDispatch = this.workersEnabled
          ? this.notificationQueue.add('send-generated-password', passwordPayload)
          : this.notificationClient.sendEmail(passwordPayload);
        passwordDispatch
          .then(() => { emailSent = true; })
          .catch((err: any) => {
            this.logger.error("Failed to send generated password email", {
              context: "AuthService",
              error: err.message,
              userId: user.id,
            });
          });
      }

      // Send email verification link (non-blocking)
      const verificationPayload = {
        to: email,
        template: 'MARKETPLACE_EMAIL_VERIFICATION',
        variables: {
          name: displayName,
          verificationLink: `${frontendUrl}/verify-email?token=${verificationToken}`,
        },
      };
      const verificationDispatch = this.workersEnabled
        ? this.notificationQueue.add('send-email-verification', verificationPayload)
        : this.notificationClient.sendEmail(verificationPayload);
      verificationDispatch
        .then(() => { verificationEmailSent = true; })
        .catch((err: any) => {
          this.logger.error("Failed to send verification email", {
            context: "AuthService",
            error: err.message,
            userId: user.id,
          });
        });
    }

    this.logger.info("User registered successfully", {
      context: "AuthService",
      userId: user.id,
      email: user.email,
      passwordWasGenerated,
    });

    return {
      message:
        "Registration successful. Please verify your email before logging in.",
      email: user.email,
      emailSent,
      verificationEmailSent,
    };
  }

  async signup(
    signupDto: SignupDto,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const {
      email,
      password,
      userType: role = "customer",
      phone,
      name,
      timezone,
      language,
    } = signupDto;

    this.logger.info("Signup attempt", {
      context: "AuthService",
      email,
      role,
      name,
    });

    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      this.logger.warn("Signup failed: User already exists", {
        context: "AuthService",
        email,
      });
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.saltRounds);

    // Create user with role, phone, name, timezone, and language
    const user = await this.userRepo.create(
      email,
      passwordHash,
      role,
      phone,
      name,
      timezone,
      language,
    );

    // Generate email verification token (but don't send email in this basic implementation)
    const verificationToken =
      await this.tokenService.createEmailVerificationToken(user.id);

    this.logger.info("User created successfully", {
      context: "AuthService",
      userId: user.id,
      email: user.email,
      // verificationToken intentionally omitted — sent via email only
    });

    // Send welcome email
    const welcomePayload = {
      to: user.email,
      template: "USER_WELCOME",
      variables: {
        userId: user.id,
        username: name || user.email.split("@")[0],
        email: user.email,
        verifyLink: `${this.configService.get<string>("FRONTEND_URL", "http://localhost:3000")}/verify-email?token=${verificationToken}`,
      },
    };
    const welcomeDispatch = this.workersEnabled
      ? this.notificationQueue.add('send-welcome', welcomePayload)
      : this.notificationClient.sendEmail(welcomePayload);
    welcomeDispatch.catch((err: any) => {
      this.logger.error("Failed to send welcome email", {
        context: "AuthService",
        error: err.message,
        userId: user.id,
      });
    });

    // Send email verification link
    const frontendUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:3000",
    );
    const verificationPayload = {
      to: user.email,
      template: 'MARKETPLACE_EMAIL_VERIFICATION',
      variables: {
        name: name || user.email.split('@')[0],
        verificationLink: `${frontendUrl}/verify-email?token=${verificationToken}`,
      },
    };
    const verificationDispatch = this.workersEnabled
      ? this.notificationQueue.add('send-email-verification', verificationPayload)
      : this.notificationClient.sendEmail(verificationPayload);
    verificationDispatch.catch((err: any) => {
      this.logger.error("Failed to send verification email", {
        context: "AuthService",
        error: err.message,
        userId: user.id,
      });
    });

    // Auto-create a minimal provider profile so the JWT contains a valid providerId
    if (role === 'provider') {
      await this.providerRepo.create(
        user.id,
        name || user.email.split('@')[0],
      ).catch((err: any) => {
        this.logger.error('Failed to auto-create provider profile during signup', {
          context: 'AuthService',
          error: err.message,
          userId: user.id,
        });
      });
    }

    // Generate tokens
    const signupProviderId = await this.resolveProviderId(user.id, user.role);
    const accessToken = await this.jwtService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      signupProviderId,
    );
    const refreshToken = await this.jwtService.generateRefreshToken(
      user.id,
      user.email,
      user.role,
      signupProviderId,
    );

    // Store refresh token in session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.configService.get<number>('SESSION_TTL_DAYS', 90));
    await this.sessionRepo.create(user.id, refreshToken, expiresAt, ipAddress);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        display_id: user.display_id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified || false,
        profile_picture_url: user.profile_picture_url,
        timezone: user.timezone || "UTC",
        language: user.language || "en",
        last_login_at: user.last_login_at,
      },
    };
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    this.logger.info("Login attempt", {
      context: "AuthService",
      email,
      ipAddress,
    });

    // Check failed login attempts
    const failedAttempts =
      await this.loginAttemptRepo.countRecentFailedAttempts(email);
    if (failedAttempts >= this.maxLoginAttempts) {
      this.logger.warn("Login blocked: Too many failed attempts", {
        context: "AuthService",
        email,
        failedAttempts,
      });
      throw new TooManyRequestsException(
        "Too many failed login attempts. Please try again later.",
      );
    }

    // Find user
    const user = await this.userRepo.findByEmail(email);
    if (!user || !user.password_hash) {
      await this.loginAttemptRepo.create(email, false, ipAddress);
      this.logger.warn("Login failed: Invalid credentials", {
        context: "AuthService",
        email,
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await this.loginAttemptRepo.create(email, false, ipAddress);
      this.logger.warn("Login failed: Invalid password", {
        context: "AuthService",
        email,
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if account is active
    if (user.status !== "active") {
      this.logger.warn("Login failed: Account not active", {
        context: "AuthService",
        email,
        status: user.status,
      });
      throw new UnauthorizedException("Account is not active");
    }

    // Check email verification
    if (!user.email_verified) {
      this.logger.warn("Login failed: Email not verified", {
        context: "AuthService",
        email,
      });
      throw new UnauthorizedException("Please verify your email before logging in");
    }

    // Record successful login
    await this.loginAttemptRepo.create(email, true, ipAddress);

    // ✅ NEW: Update last login timestamp
    await this.userRepo.updateLastLogin(user.id);

    this.logger.info("Login successful", {
      context: "AuthService",
      userId: user.id,
      email: user.email,
    });

    // Generate tokens
    const loginProviderId = await this.resolveProviderId(user.id, user.role);
    const accessToken = await this.jwtService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      loginProviderId,
    );
    const refreshToken = await this.jwtService.generateRefreshToken(
      user.id,
      user.email,
      user.role,
      loginProviderId,
    );

    // Store refresh token in session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.configService.get<number>('SESSION_TTL_DAYS', 90));
    await this.sessionRepo.create(user.id, refreshToken, expiresAt, ipAddress);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        display_id: user.display_id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified || false,
        profile_picture_url: user.profile_picture_url,
        timezone: user.timezone || "UTC",
        language: user.language || "en",
        last_login_at: user.last_login_at,
      },
    };
  }

  async logout(refreshToken?: string, userId?: string): Promise<void> {
    this.logger.info("Logout attempt", { context: "AuthService" });

    if (refreshToken) {
      await this.sessionRepo.deleteByRefreshToken(refreshToken);
    } else if (userId) {
      await this.sessionRepo.deleteByUserId(userId);
    }

    this.logger.info("Logout successful", { context: "AuthService" });
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verifyRefreshToken(refreshToken);

      // Check if session exists
      const session = await this.sessionRepo.findByRefreshToken(refreshToken);
      if (!session) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Check if session is expired
      if (new Date() > new Date(session.expires_at)) {
        await this.sessionRepo.deleteByRefreshToken(refreshToken);
        throw new UnauthorizedException("Refresh token expired");
      }

      // Get user
      const user = await this.userRepo.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      // Generate new access token
      const refreshProviderId = payload.providerId ?? await this.resolveProviderId(user.id, user.role);
      const accessToken = await this.jwtService.generateAccessToken(
        user.id,
        user.email,
        user.role,
        refreshProviderId,
      );

      return { accessToken };
    } catch (error: any) {
      this.logger.error("Refresh token failed", {
        context: "AuthService",
        error: error.message,
      });
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    this.logger.info("Password reset requested", {
      context: "AuthService",
      email,
    });

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      this.logger.warn("Password reset requested for non-existent user", {
        context: "AuthService",
        email,
      });
      return;
    }

    const resetToken = await this.tokenService.createPasswordResetToken(
      user.id,
    );

    this.logger.info("Password reset token created", {
      context: "AuthService",
      userId: user.id,
    });

    // Send password reset email — queue if workers enabled, else inline
    const frontendUrl = this.configService.get<string>("FRONTEND_URL", "http://localhost:3000");
    const resetPayload = {
      to: user.email,
      template: 'MARKETPLACE_PASSWORD_RESET',
      variables: {
        name: user.name || user.email.split('@')[0],
        resetLink: `${frontendUrl}/reset-password?token=${resetToken}`,
      },
    };
    const resetDispatch = this.workersEnabled
      ? this.notificationQueue.add('send-password-reset', resetPayload)
      : this.notificationClient.sendEmail(resetPayload);
    resetDispatch.catch((err: any) =>
      this.logger.error("Failed to send password reset email", {
        context: "AuthService",
        error: err.message,
        userId: user.id,
      }),
    );
  }

  async confirmPasswordReset(
    token: string,
    newPassword: string,
  ): Promise<void> {
    this.logger.info("Password reset confirmation attempt", {
      context: "AuthService",
    });

    const userId = await this.tokenService.verifyPasswordResetToken(token);
    if (!userId) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

    // Update password
    await this.userRepo.updatePassword(userId, passwordHash);

    // Delete all sessions for this user (force re-login)
    await this.sessionRepo.deleteByUserId(userId);

    this.logger.info("Password reset successful", {
      context: "AuthService",
      userId,
    });
  }

  async getProfile(userId: string): Promise<any> {
    if (!userId) {
      throw new UnauthorizedException("User ID is required to retrieve profile");
    }

    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      display_id: user.display_id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified || false,
      profile_picture_url: user.profile_picture_url,
      timezone: user.timezone || "UTC",
      language: user.language || "en",
      last_login_at: user.last_login_at,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      deleted_at: user.deleted_at,
    };
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<any> {
    if (!userId) {
      throw new UnauthorizedException("User ID is required to update profile");
    }

    // If email is being changed, verify the new address is not already taken
    if (updateUserDto.email) {
      const existingUser = await this.userRepo.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException("Email address is already in use by another account");
      }
    }

    const updatedUser = await this.userRepo.update(
      userId,
      updateUserDto.name,
      updateUserDto.email,
      updateUserDto.phone,
      updateUserDto.profilePictureUrl,
      updateUserDto.timezone,
      updateUserDto.language,
    );

    return {
      id: updatedUser.id,
      display_id: updatedUser.display_id,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      role: updatedUser.role,
      email_verified: updatedUser.email_verified,
      phone_verified: updatedUser.phone_verified || false,
      profile_picture_url: updatedUser.profile_picture_url,
      timezone: updatedUser.timezone || "UTC",
      language: updatedUser.language || "en",
      last_login_at: updatedUser.last_login_at,
      status: updatedUser.status,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
      deleted_at: updatedUser.deleted_at,
    };
  }

  async verifyEmail(token: string): Promise<void> {
    this.logger.info("Email verification attempt", { context: "AuthService" });

    const userId = await this.tokenService.verifyEmailToken(token);
    if (!userId) {
      throw new BadRequestException("Invalid or expired verification token");
    }

    await this.userRepo.verifyEmail(userId);

    // Send confirmation email
    const verifiedUser = await this.userRepo.findById(userId).catch(() => null);
    if (verifiedUser?.email) {
      const verifiedPayload = {
        to: verifiedUser.email,
        template: 'EMAIL_VERIFIED',
        variables: {
          username: verifiedUser.name || verifiedUser.email.split('@')[0],
          verifiedItem: verifiedUser.email,
        },
      };
      const verifiedDispatch = this.workersEnabled
        ? this.notificationQueue.add('send-email-verified', verifiedPayload)
        : this.notificationClient.sendEmail(verifiedPayload);
      verifiedDispatch.catch((err: any) => {
        this.logger.error('Failed to send email verified confirmation', {
          context: 'AuthService',
          error: err.message,
          userId,
        });
      });
    }

    this.logger.info("Email verified successfully", {
      context: "AuthService",
      userId,
    });
  }

  /**
   * Handle OAuth login (Google, Facebook)
   * Creates user if doesn't exist, links social account if exists
   */
  async handleOAuthLogin(
    oauthUser: OAuthUserDto,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const { provider, providerId, email, name, accessToken, refreshToken } =
      oauthUser;

    this.logger.info("OAuth login attempt", {
      context: "AuthService",
      provider,
      email,
    });

    // Check if social account already exists
    let socialAccount = await this.socialAccountRepo.findByProvider(
      provider,
      providerId,
    );
    let user;

    if (socialAccount) {
      // Social account exists, get the user
      user = await this.userRepo.findById(socialAccount.user_id);

      if (!user) {
        this.logger.error("Social account exists but user not found", {
          context: "AuthService",
          socialAccountId: socialAccount.id,
        });
        throw new NotFoundException("User not found");
      }

      // Update tokens
      await this.socialAccountRepo.updateTokens(
        socialAccount.id,
        accessToken,
        refreshToken,
      );

      this.logger.info("OAuth login: Existing social account", {
        context: "AuthService",
        userId: user.id,
        provider,
      });
    } else {
      // Social account doesn't exist, check if user exists with this email
      user = await this.userRepo.findByEmail(email);

      if (user) {
        // User exists, link social account
        socialAccount = await this.socialAccountRepo.create(
          user.id,
          provider,
          providerId,
          accessToken,
          refreshToken,
        );

        this.logger.info(
          "OAuth login: Linked social account to existing user",
          {
            context: "AuthService",
            userId: user.id,
            provider,
          },
        );
      } else {
        // Create new user with OAuth
        // No password needed for OAuth users
        user = await this.userRepo.create(
          email,
          null, // No password for OAuth users
          "customer", // Default role
          null, // No phone initially
          name || null, // Name from OAuth provider profile
        );

        // Mark email as verified since OAuth provides verified email
        await this.userRepo.verifyEmail(user.id);

        // Create social account link
        socialAccount = await this.socialAccountRepo.create(
          user.id,
          provider,
          providerId,
          accessToken,
          refreshToken,
        );

        this.logger.info("OAuth login: Created new user with social account", {
          context: "AuthService",
          userId: user.id,
          provider,
        });
      }
    }

    // Generate JWT tokens
    const oauthProviderId = await this.resolveProviderId(user.id, user.role);
    const jwtAccessToken = await this.jwtService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      oauthProviderId,
    );
    const jwtRefreshToken = await this.jwtService.generateRefreshToken(
      user.id,
      user.email,
      user.role,
      oauthProviderId,
    );

    // Store refresh token in session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.configService.get<number>('SESSION_TTL_DAYS', 90));
    await this.sessionRepo.create(
      user.id,
      jwtRefreshToken,
      expiresAt,
      ipAddress,
    );

    this.logger.info("OAuth login successful", {
      context: "AuthService",
      userId: user.id,
      provider,
    });

    return {
      accessToken: jwtAccessToken,
      refreshToken: jwtRefreshToken,
      user: {
        id: user.id,
        display_id: user.display_id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified || false,
        profile_picture_url: user.profile_picture_url,
        timezone: user.timezone || "UTC",
        language: user.language || "en",
        last_login_at: user.last_login_at,
      },
    };
  }

  /**
   * Login with phone and password
   */
  async loginWithPhone(
    phone: string,
    password: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    this.logger.info("Phone login attempt", {
      context: "AuthService",
      phone,
      ipAddress,
    });

    // Check failed login attempts
    const failedAttempts =
      await this.loginAttemptRepo.countRecentFailedAttempts(phone);
    if (failedAttempts >= this.maxLoginAttempts) {
      this.logger.warn("Phone login blocked: Too many failed attempts", {
        context: "AuthService",
        phone,
        failedAttempts,
      });
      throw new TooManyRequestsException(
        "Too many failed login attempts. Please try again later.",
      );
    }

    // Find user by phone
    const user = await this.userRepo.findByPhone(phone);
    if (!user || !user.password_hash) {
      await this.loginAttemptRepo.create(phone, false, ipAddress);
      this.logger.warn("Phone login failed: Invalid credentials", {
        context: "AuthService",
        phone,
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await this.loginAttemptRepo.create(phone, false, ipAddress);
      this.logger.warn("Phone login failed: Invalid password", {
        context: "AuthService",
        phone,
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if account is active
    if (user.status !== "active") {
      this.logger.warn("Phone login failed: Account not active", {
        context: "AuthService",
        phone,
        status: user.status,
      });
      throw new UnauthorizedException("Account is not active");
    }

    // Check email verification
    if (!user.email_verified) {
      this.logger.warn("Phone login failed: Email not verified", {
        context: "AuthService",
        phone,
      });
      throw new UnauthorizedException("Please verify your email before logging in");
    }

    // Record successful login
    await this.loginAttemptRepo.create(phone, true, ipAddress);

    this.logger.info("Phone login successful", {
      context: "AuthService",
      userId: user.id,
      phone,
    });

    // Generate tokens
    const phoneLoginProviderId = await this.resolveProviderId(user.id, user.role);
    const accessToken = await this.jwtService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      phoneLoginProviderId,
    );
    const refreshToken = await this.jwtService.generateRefreshToken(
      user.id,
      user.email,
      user.role,
      phoneLoginProviderId,
    );

    // Store refresh token in session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.configService.get<number>('SESSION_TTL_DAYS', 90));
    await this.sessionRepo.create(user.id, refreshToken, expiresAt, ipAddress);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        display_id: user.display_id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified || false,
        profile_picture_url: user.profile_picture_url,
        timezone: user.timezone || "UTC",
        language: user.language || "en",
        last_login_at: user.last_login_at,
      },
    };
  }

  /**
   * Request OTP for phone login
   */
  async requestPhoneOtp(phone: string): Promise<{ message: string }> {
    this.logger.info("OTP request for phone login", {
      context: "AuthService",
      phone,
    });

    // Rate limit: max 5 OTP requests per 15-minute window per phone number
    const recentRequests = await this.loginAttemptRepo.countRecentFailedAttempts(phone);
    if (recentRequests >= 5) {
      this.logger.warn("Phone OTP rate limit exceeded", { context: "AuthService", phone });
      throw new TooManyRequestsException(
        "Too many OTP requests. Please wait before requesting another OTP.",
      );
    }
    // Record this request for rate limiting purposes
    await this.loginAttemptRepo.create(phone, false, null);

    // Check if SMS service is enabled
    if (!this.isOtpServiceAvailable("phone")) {
      this.logger.warn("OTP request attempted but SMS service is disabled", {
        context: "AuthService",
        phone,
      });
      throw new BadRequestException(
        "SMS service is currently unavailable. Please use password login instead.",
      );
    }

    // Check if user exists with this phone
    const user = await this.userRepo.findByPhone(phone);
    if (!user) {
      // Don't reveal if user exists
      this.logger.warn("OTP requested for non-existent phone", {
        context: "AuthService",
        phone,
      });
      // Still return success to avoid user enumeration
      return {
        message: "If the phone number is registered, an OTP has been sent",
      };
    }

    // Check if account is active
    if (user.status !== "active") {
      this.logger.warn("OTP request for inactive account", {
        context: "AuthService",
        phone,
        status: user.status,
      });
      throw new UnauthorizedException("Account is not active");
    }

    try {
      // Send OTP via SMS service
      await this.smsClient.sendOtp(phone, "login");

      this.logger.info("OTP sent successfully", {
        context: "AuthService",
        phone,
      });

      return { message: "OTP sent successfully" };
    } catch (error: any) {
      this.logger.error("Failed to send OTP", {
        context: "AuthService",
        phone,
        error: error.message,
      });
      throw new BadRequestException("Failed to send OTP. Please try again.");
    }
  }

  /**
   * Verify OTP and login
   */
  async verifyPhoneOtp(
    phone: string,
    code: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    this.logger.info("OTP verification attempt for phone login", {
      context: "AuthService",
      phone,
    });

    // Check if SMS service is enabled
    if (!this.isOtpServiceAvailable("phone")) {
      this.logger.warn(
        "OTP verification attempted but SMS service is disabled",
        { context: "AuthService", phone },
      );
      throw new BadRequestException(
        "SMS service is currently unavailable. Please use password login instead.",
      );
    }

    // Find user by phone
    const user = await this.userRepo.findByPhone(phone);
    if (!user) {
      this.logger.warn("OTP verification failed: User not found", {
        context: "AuthService",
        phone,
      });
      throw new UnauthorizedException("Invalid phone number or OTP");
    }

    // Check if account is active
    if (user.status !== "active") {
      this.logger.warn("OTP verification failed: Account not active", {
        context: "AuthService",
        phone,
        status: user.status,
      });
      throw new UnauthorizedException("Account is not active");
    }

    try {
      // Verify OTP via SMS service
      const verificationResult = await this.smsClient.verifyOtp(
        phone,
        code,
        "login",
      );

      if (!verificationResult.valid) {
        this.logger.warn("OTP verification failed: Invalid code", {
          context: "AuthService",
          phone,
          message: verificationResult.message,
        });
        throw new UnauthorizedException("Invalid or expired OTP");
      }

      this.logger.info("OTP verification successful, logging in user", {
        context: "AuthService",
        userId: user.id,
        phone,
      });

      // Generate tokens
      const phoneOtpProviderId = await this.resolveProviderId(user.id, user.role);
      const accessToken = await this.jwtService.generateAccessToken(
        user.id,
        user.email,
        user.role,
        phoneOtpProviderId,
      );
      const refreshToken = await this.jwtService.generateRefreshToken(
        user.id,
        user.email,
        user.role,
        phoneOtpProviderId,
      );

      // Store refresh token in session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.configService.get<number>('SESSION_TTL_DAYS', 90));
      await this.sessionRepo.create(
        user.id,
        refreshToken,
        expiresAt,
        ipAddress,
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          display_id: user.display_id,
          email: user.email,
          name: user.name,
          role: user.role,
          email_verified: user.email_verified,
          phone_verified: user.phone_verified || false,
          profile_picture_url: user.profile_picture_url,
          timezone: user.timezone || "UTC",
          language: user.language || "en",
          last_login_at: user.last_login_at,
        },
      };
    } catch (error: any) {
      this.logger.error("OTP verification error", {
        context: "AuthService",
        phone,
        error: error.message,
      });

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new BadRequestException(
        "OTP verification failed. Please try again.",
      );
    }
  }

  // ==========================================
  // Email OTP Routes
  // ==========================================

  async requestEmailOtp(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    this.logger.info("Email OTP request", {
      context: "AuthService",
      email: normalizedEmail,
    });

    // Rate limit: max 5 OTP requests per 15-minute window per email
    const recentRequests = await this.loginAttemptRepo.countRecentFailedAttempts(normalizedEmail);
    if (recentRequests >= 5) {
      this.logger.warn("Email OTP rate limit exceeded", { context: "AuthService", email: normalizedEmail });
      throw new TooManyRequestsException(
        "Too many OTP requests. Please wait before requesting another OTP.",
      );
    }
    // Record this request for rate limiting purposes
    await this.loginAttemptRepo.create(normalizedEmail, false, null);

    if (!this.notificationClient.isEmailEnabled()) {
      this.logger.warn("Email OTP request but email service is disabled", {
        context: "AuthService",
        email,
      });
      throw new BadRequestException(
        "Email OTP service is currently unavailable. Please use password login instead.",
      );
    }

    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      // Avoid email enumeration
      return { message: "If this email is registered, an OTP will be sent" };
    }

    if (user.status !== "active") {
      throw new UnauthorizedException("Account is not active");
    }

    const otp = await this.tokenService.createEmailOtpToken(user.id);

    void this.notificationClient
      .sendEmail({
        to: normalizedEmail,
        template: 'otpEmailTemplate',
        variables: {
          name: user.name || normalizedEmail.split('@')[0],
          username: user.name || normalizedEmail.split('@')[0],
          otp,
          purpose: 'login',
          expiryMinutes: 10,
        },
      })
      .then((sent) => {
        if (!sent) {
          this.logger.warn("Email OTP delivery returned false", {
            context: "AuthService",
            userId: user.id,
          });
        }
      })
      .catch((err: any) => {
        this.logger.error("Email OTP delivery failed", {
          context: "AuthService",
          userId: user.id,
          error: err.message,
        });
      });

    this.logger.info("Email OTP sent", {
      context: "AuthService",
      userId: user.id,
    });
    return { message: "If this email is registered, an OTP will be sent" };
  }

  async verifyEmailOtp(
    email: string,
    code: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const normalizedEmail = email.trim().toLowerCase();
    this.logger.info("Email OTP verification attempt", {
      context: "AuthService",
      email: normalizedEmail,
    });

    if (!this.notificationClient.isEmailEnabled()) {
      throw new BadRequestException(
        "Email OTP service is currently unavailable. Please use password login instead.",
      );
    }

    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException("Invalid email or OTP");
    }

    if (user.status !== "active") {
      throw new UnauthorizedException("Account is not active");
    }

    const valid = await this.tokenService.verifyEmailOtpToken(
      user.id,
      code.trim(),
    );
    if (!valid) {
      this.logger.warn(
        "Email OTP verification failed: invalid or expired code",
        {
          context: "AuthService",
          email: normalizedEmail,
        },
      );
      throw new UnauthorizedException("Invalid or expired OTP");
    }

    const emailOtpProviderId = await this.resolveProviderId(user.id, user.role);
    const accessToken = await this.jwtService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      emailOtpProviderId,
    );
    const refreshToken = await this.jwtService.generateRefreshToken(
      user.id,
      user.email,
      user.role,
      emailOtpProviderId,
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.configService.get<number>('SESSION_TTL_DAYS', 90));
    await this.sessionRepo.create(user.id, refreshToken, expiresAt, ipAddress);

    this.logger.info("Email OTP login successful", {
      context: "AuthService",
      userId: user.id,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        display_id: user.display_id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified || false,
        profile_picture_url: user.profile_picture_url,
        timezone: user.timezone || "UTC",
        language: user.language || "en",
        last_login_at: user.last_login_at,
      },
    };
  }

  /**
   * Verify JWT token and return user information (for API Gateway)
   */
  async verifyTokenAndGetUserInfo(token: string): Promise<{
    userId: string;
    email: string;
    role: string;
    name?: string;
    phone?: string;
  }> {
    try {
      // Verify the JWT token
      const payload = this.jwtService.verifyAccessToken(token);

      this.logger.debug("Token verified successfully", {
        context: "AuthService",
        userId: payload.sub,
      });

      // Fetch additional user info from database
      const user = await this.userRepo.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      // Check if account is active
      if (user.status !== "active") {
        throw new UnauthorizedException("Account is not active");
      }

      // Return user information
      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
      };
    } catch (error: any) {
      this.logger.error("Token verification failed", {
        context: "AuthService",
        error: error.message,
      });

      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  /**
   * Check if email or phone exists in the system
   */
  async checkIdentifierExists(
    identifier: string,
    type: "email" | "phone",
  ): Promise<boolean> {
    this.logger.info("Checking identifier existence", {
      context: "AuthService",
      type,
    });

    try {
      if (type === "email") {
        const user = await this.userRepo.findByEmail(identifier);
        return !!user;
      } else if (type === "phone") {
        const user = await this.userRepo.findByPhone(identifier);
        return !!user;
      }

      return false;
    } catch (error: any) {
      this.logger.error("Error checking identifier", {
        context: "AuthService",
        type,
        error: error.message,
      });

      // Return true on error to prevent user enumeration via error states
      return true;
    }
  }

  /**
   * Check if OTP services (SMS/Email) are enabled and available
   */
  isOtpServiceAvailable(type: "email" | "phone"): boolean {
    try {
      if (type === "phone") {
        // Check if SMS service is configured
        const smsEnabled =
          this.configService.get<string>("SMS_SERVICE_ENABLED", "false") ===
          "true";
        const twilioSid = this.configService.get<string>("TWILIO_ACCOUNT_SID");
        const twilioToken = this.configService.get<string>("TWILIO_AUTH_TOKEN");

        return smsEnabled && !!twilioSid && !!twilioToken;
      } else if (type === "email") {
        // Check if Email service is configured
        const emailEnabled =
          this.configService.get<string>("EMAIL_SERVICE_ENABLED", "false") ===
          "true";
        const smtpHost = this.configService.get<string>("SMTP_HOST");
        const smtpUser = this.configService.get<string>("SMTP_USER");

        return emailEnabled && !!smtpHost && !!smtpUser;
      }

      return false;
    } catch (error: any) {
      this.logger.error("Error checking OTP service availability", {
        context: "AuthService",
        type,
        error: error.message,
      });
      return false;
    }
  }

  // ==========================================
  // FUTURE FEATURE METHODS (Not yet implemented)
  // ==========================================

  /**
   * TWO-FACTOR AUTHENTICATION (2FA)
   * Uses TOTP (Time-based One-Time Password) via otplib
   */

  async get2FAStatus(userId: string): Promise<boolean> {
    return this.twoFactorSecretRepo.is2FAEnabled(userId);
  }

  /**
   * Returns the existing pending 2FA QR code without regenerating the secret.
   * If no setup exists yet, delegates to enable2FA() to create one.
   */
  async get2FAQRCode(userId: string): Promise<{ qrCodeUrl: string }> {
    const existing = await this.twoFactorSecretRepo.findByUserId(userId);
    if (existing?.secret) {
      const qrCodeUrl = `otpauth://totp/LocalServiceMarketplace:${userId}?secret=${existing.secret}&issuer=LocalServiceMarketplace`;
      return { qrCodeUrl };
    }
    // No setup yet — create one
    const result = await this.enable2FA(userId);
    return { qrCodeUrl: result.qrCodeUrl };
  }

  async enable2FA(
    userId: string,
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    this.logger.info("2FA enable requested", {
      context: "AuthService",
      userId,
    });

    // Check if 2FA already enabled
    const existing = await this.twoFactorSecretRepo.findByUserId(userId);
    if (existing?.enabled) {
      throw new BadRequestException("2FA is already enabled");
    }

    // Generate TOTP secret (use otplib on frontend or generate here)
    const secret = this.generateRandomSecret(); // 32-char base32
    const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=otpauth://totp/LocalServiceMarketplace:${userId}?secret=${secret}&issuer=LocalServiceMarketplace`;

    // Store secret (disabled until verified)
    if (existing) {
      await this.twoFactorSecretRepo.updateSecret(userId, secret);
    } else {
      await this.twoFactorSecretRepo.create(userId, secret, []);
    }

    return { secret, qrCodeUrl };
  }

  async verify2FA(userId: string, code: string): Promise<void> {
    this.logger.info("2FA verification", { context: "AuthService", userId });

    const secretRecord = await this.twoFactorSecretRepo.findByUserId(userId);
    if (!secretRecord) {
      throw new NotFoundException("2FA not setup");
    }

    // Verify TOTP code using otplib (implement in service)
    const isValid = this.verifyTOTP(secretRecord.secret, code);
    if (!isValid) {
      throw new BadRequestException("Invalid 2FA code");
    }

    // Enable 2FA
    await this.twoFactorSecretRepo.enable(userId);

    // Generate backup codes
    const backupCodes = this._generateRandomBackupCodes(10);
    await this.twoFactorSecretRepo.updateBackupCodes(userId, backupCodes);

    this.logger.info("2FA enabled successfully", {
      context: "AuthService",
      userId,
    });
  }

  async disable2FA(
    userId: string,
    password: string,
    code?: string,
  ): Promise<void> {
    this.logger.info("2FA disable requested", {
      context: "AuthService",
      userId,
    });

    // Verify password
    const user = await this.userRepo.findById(userId);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException("Invalid password");
    }

    // If code provided, verify it as extra security
    if (code) {
      const secretRecord = await this.twoFactorSecretRepo.findByUserId(userId);
      if (!secretRecord || !this.verifyTOTP(secretRecord.secret, code)) {
        throw new BadRequestException("Invalid 2FA code");
      }
    }

    await this.twoFactorSecretRepo.disable(userId);
    this.logger.info("2FA disabled", { context: "AuthService", userId });
  }

  async generateBackupCodes(
    userId: string,
    count: number = 10,
  ): Promise<string[]> {
    this.logger.info("Generating backup codes", {
      context: "AuthService",
      userId,
    });

    const codes = this._generateRandomBackupCodes(count);
    await this.twoFactorSecretRepo.updateBackupCodes(userId, codes);

    return codes;
  }

  async useBackupCode(userId: string, code: string): Promise<boolean> {
    this.logger.info("Using backup code", { context: "AuthService", userId });

    const consumed = await this.twoFactorSecretRepo.consumeBackupCode(
      userId,
      code,
    );
    if (!consumed) {
      throw new BadRequestException("Invalid or already used backup code");
    }

    return true;
  }

  async is2FAEnabled(userId: string): Promise<boolean> {
    return this.twoFactorSecretRepo.is2FAEnabled(userId);
  }

  /**
   * SESSION & DEVICE MANAGEMENT
   */

  async getSessions(userId: string): Promise<any[]> {
    this.logger.info("Fetching sessions", { context: "AuthService", userId });

    const sessions = await this.sessionRepo.findByUserId(userId);
    // Return sanitized session info (no refresh_token)
    return sessions.map((s) => ({
      id: s.id,
      ip_address: s.ip_address,
      user_agent: s.user_agent,
      device_type: s.device_type,
      location: s.location,
      created_at: s.created_at,
      expires_at: s.expires_at,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    this.logger.info("Revoking session", {
      context: "AuthService",
      userId,
      sessionId,
    });

    // Verify session belongs to user
    const session = await this.sessionRepo.findByUserId(userId);
    const target = session.find((s) => s.id === sessionId);
    if (!target) {
      throw new NotFoundException("Session not found");
    }

    await this.sessionRepo.deleteByRefreshToken(target.refresh_token);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    this.logger.info("Revoking all sessions", {
      context: "AuthService",
      userId,
    });

    await this.sessionRepo.deleteByUserId(userId);
  }

  async getDevices(userId: string): Promise<any[]> {
    this.logger.info("Fetching devices", { context: "AuthService", userId });

    // Query user_devices table (already exists)
    const query = `
      SELECT * FROM user_devices 
      WHERE user_id = $1 
      ORDER BY last_seen DESC
    `;
    const result = await this.sessionRepo["pool"].query(query, [userId]);
    return result.rows;
  }

  async removeDevice(userId: string, deviceId: string): Promise<void> {
    this.logger.info("Removing device", {
      context: "AuthService",
      userId,
      deviceId,
    });

    const query =
      "DELETE FROM user_devices WHERE user_id = $1 AND device_id = $2";
    await this.sessionRepo["pool"].query(query, [userId, deviceId]);
  }

  /**
   * ACCOUNT MANAGEMENT
   */

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    this.logger.info("Change password", { context: "AuthService", userId });

    const user = await this.userRepo.findById(userId);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const newHash = await bcrypt.hash(newPassword, this.saltRounds);
    await this.userRepo.updatePassword(userId, newHash);

    // Invalidate all sessions after password change
    await this.sessionRepo.deleteByUserId(userId);

    // Notify user that their password was changed
    const passwordChangedPayload = {
      to: user.email,
      template: 'PASSWORD_CHANGED',
      variables: {
        name: user.name || user.email.split('@')[0],
        username: user.name || user.email.split('@')[0],
      },
    };
    const passwordChangedDispatch = this.workersEnabled
      ? this.notificationQueue.add('send-password-changed', passwordChangedPayload)
      : this.notificationClient.sendEmail(passwordChangedPayload);
    passwordChangedDispatch.catch((err: any) => {
      this.logger.error('Failed to send password changed notification', {
        context: 'AuthService',
        error: err.message,
        userId,
      });
    });

    this.logger.info('Password changed successfully', {
      context: 'AuthService',
      userId,
    });
  }

  async resendVerificationEmail(email: string): Promise<void> {
    this.logger.info("Resend verification email", {
      context: "AuthService",
      email,
    });

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      // Don't reveal non-existence
      return;
    }

    if (user.email_verified) {
      throw new BadRequestException("Email already verified");
    }

    const token = await this.tokenService.createEmailVerificationToken(user.id);
    const frontendUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:3000",
    );

    const verificationPayload = {
      to: email,
      template: 'MARKETPLACE_EMAIL_VERIFICATION',
      variables: {
        name: user.name || email.split('@')[0],
        verificationLink: `${frontendUrl}/verify-email?token=${token}`,
      },
    };

    if (this.workersEnabled) {
      await this.notificationQueue.add('send-email-verification', verificationPayload);
    } else {
      const sent = await this.notificationClient
        .sendEmail(verificationPayload)
        .catch((err: any) => {
          this.logger.error("Failed to send verification email", {
            context: "AuthService",
            error: err.message,
            userId: user.id,
          });
          throw new BadRequestException(
            "Failed to send verification email. Please try again later.",
          );
        });

      if (!sent) {
        throw new BadRequestException(
          "Failed to send verification email. Please try again later.",
        );
      }
    }
  }

  async deactivateAccount(
    userId: string,
    password: string,
    reason?: string,
  ): Promise<void> {
    this.logger.info("Deactivate account", { context: "AuthService", userId });

    // Verify password
    const user = await this.userRepo.findById(userId);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException("Invalid password");
    }

    // Set status to suspended
    await this.userRepo.updateStatus(userId, "suspended");

    // Invalidate all sessions
    await this.sessionRepo.deleteByUserId(userId);

    this.logger.info("Account deactivated", {
      context: "AuthService",
      userId,
      reason,
    });

    // Enqueue deactivation notification
    if (user.email) {
      this.notificationQueue
        .add('send-account-deactivated', {
          to: user.email,
          template: 'USER_SUSPENDED',
          variables: {
            userId: user.id,
            username: user.name || user.email.split('@')[0],
            email: user.email,
            timestamp: new Date().toISOString(),
            reason: reason ?? 'Account deactivated',
          },
        })
        .catch(() => null);
    }
  }

  async requestAccountDeletion(
    userId: string,
    password: string,
    reason?: string,
  ): Promise<void> {
    this.logger.info("Request account deletion", {
      context: "AuthService",
      userId,
    });

    // Verify password
    const user = await this.userRepo.findById(userId);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException("Invalid password");
    }

    // Create deletion request
    await this.accountDeletionRequestRepo.create(userId, reason);

    // Enqueue deletion confirmation email (non-blocking)
    this.notificationQueue
      .add('send-account-deletion-requested', {
        to: user.email,
        template: 'USER_DELETED',
        variables: {
          userId: user.id,
          username: user.name || user.email.split('@')[0],
          email: user.email,
          timestamp: new Date().toISOString(),
          reason: reason ?? 'Account deletion requested',
        },
      })
      .catch((err: any) =>
        this.logger.error("Failed to enqueue deletion email", {
          error: err.message,
        }),
      );
  }

  async cancelAccountDeletion(userId: string, password: string): Promise<void> {
    this.logger.info("Cancel account deletion", {
      context: "AuthService",
      userId,
    });

    const user = await this.userRepo.findById(userId);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException("Invalid password");
    }

    await this.accountDeletionRequestRepo.cancel(userId);
    await this.userRepo.updateStatus(userId, "active"); // Reactivate account
  }

  async getLoginHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<any[]> {
    this.logger.info("Fetching login history", {
      context: "AuthService",
      userId,
    });

    return await this.loginHistoryRepo.findByUserId(userId, limit, offset);
  }

  /**
   * SOCIAL ACCOUNT LINKING
   */

  async getLinkedSocialAccounts(userId: string): Promise<any[]> {
    this.logger.info("Fetching linked social accounts", {
      context: "AuthService",
      userId,
    });

    return await this.socialAccountRepo.findByUserId(userId);
  }

  async linkSocialAccount(
    userId: string,
    provider: "google" | "facebook",
    providerUserId: string,
    accessToken: string,
    refreshToken?: string,
  ): Promise<void> {
    this.logger.info("Linking social account", {
      context: "AuthService",
      userId,
      provider,
    });

    // Check if already linked
    const existing = await this.socialAccountRepo.findByProvider(
      provider,
      providerUserId,
    );
    if (existing) {
      throw new ConflictException(
        "This social account is already linked to another user",
      );
    }

    await this.socialAccountRepo.create(
      userId,
      provider,
      providerUserId,
      accessToken,
      refreshToken,
    );
  }

  async unlinkSocialAccount(userId: string, provider: string): Promise<void> {
    this.logger.info("Unlinking social account", {
      context: "AuthService",
      userId,
      provider,
    });

    await this.socialAccountRepo.delete(userId, provider);
  }

  /**
   * MAGIC LINK (PASSWORDLESS)
   */

  async requestMagicLink(
    email: string,
    redirectUrl?: string,
  ): Promise<{ message: string }> {
    this.logger.info("Magic link requested", { context: "AuthService", email });

    // Check if user exists (optional: allow guest magic link)
    const user = await this.userRepo.findByEmail(email);

    // Generate token
    const token = this.generateSecureToken(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await this.magicLinkTokenRepo.create(email, token, expiresAt, user?.id);

    // Send email with magic link
    const frontendUrl =
      redirectUrl ||
      this.configService.get<string>("FRONTEND_URL", "http://localhost:3000");
    const magicLink = `${frontendUrl}/auth/magic-link?token=${token}`;

    const magicLinkPayload = {
      to: email,
      template: 'MAGIC_LINK',
      variables: {
        username: user?.name || email.split('@')[0],
        magicUrl: magicLink,
        expiryMinutes: 60,
      },
    };
    const magicDispatch = this.workersEnabled
      ? this.notificationQueue.add('send-magic-link', magicLinkPayload)
      : this.notificationClient.sendEmail(magicLinkPayload);
    magicDispatch.catch((err: any) => {
      this.logger.error("Failed to send magic link email", {
        error: err.message,
      });
    });

    return { message: "Magic link sent if email is registered" };
  }

  async verifyMagicLink(
    token: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    this.logger.info("Magic link verification", { context: "AuthService" });

    const magicLink = await this.magicLinkTokenRepo.findByToken(token);
    if (!magicLink) {
      throw new BadRequestException("Invalid or expired magic link");
    }

    // Mark as used
    await this.magicLinkTokenRepo.markAsUsed(magicLink.id);

    // Find or create user
    let user;
    if (magicLink.user_id) {
      user = await this.userRepo.findById(magicLink.user_id);
    } else {
      // Guest flow: create new user with random password
      const randomPassword = this.generateRandomPassword();
      const passwordHash = await bcrypt.hash(randomPassword, this.saltRounds);
      user = await this.userRepo.create(
        magicLink.email,
        passwordHash,
        "customer",
      );
    }

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Generate tokens
    const magicLinkProviderId = await this.resolveProviderId(user.id, user.role);
    const accessToken = await this.jwtService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      magicLinkProviderId,
    );
    const refreshToken = await this.jwtService.generateRefreshToken(
      user.id,
      user.email,
      user.role,
      magicLinkProviderId,
    );

    await this.sessionRepo.create(
      user.id,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified || false,
        profile_picture_url: user.profile_picture_url,
        timezone: user.timezone || "UTC",
        language: user.language || "en",
        last_login_at: user.last_login_at,
      },
    };
  }

  /**
   * APPLE SIGN IN
   */

  async appleMobileSignIn(
    identityToken: string,
    authorizationCode?: string,
    fullName?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    this.logger.info("Apple mobile sign-in", { context: "AuthService" });

    // Verify Apple identity token (JWT) using Apple's public keys
    const appleUserId = await this.verifyAppleIdentityToken(identityToken);
    if (!appleUserId) {
      throw new UnauthorizedException("Invalid Apple identity token");
    }

    // Check if social account exists
    const socialAccount = await this.socialAccountRepo.findByProvider(
      "apple",
      appleUserId,
    );
    let user;

    if (socialAccount) {
      user = await this.userRepo.findById(socialAccount.user_id);
      if (!user) throw new NotFoundException("User not found");
    } else {
      // Create new user or link to existing email (extract email from Apple token)
      const email = this.extractEmailFromAppleToken(identityToken);
      user = await this.userRepo.findByEmail(email);

      if (user) {
        // Link Apple to existing account
        await this.socialAccountRepo.create(
          user.id,
          "apple",
          appleUserId,
          identityToken,
          authorizationCode,
        );
      } else {
        // Create new user
        let name;
        if (fullName) {
          try {
            const nameObj = JSON.parse(fullName);
            name =
              `${nameObj.givenName || ""} ${nameObj.familyName || ""}`.trim();
          } catch {
            name = fullName;
          }
        }
        user = await this.userRepo.create(
          email,
          null,
          "customer",
          undefined,
          name,
        );
        await this.userRepo.verifyEmail(user.id); // Apple provides verified email
        await this.socialAccountRepo.create(
          user.id,
          "apple",
          appleUserId,
          identityToken,
          authorizationCode,
        );
      }
    }

    // Generate tokens
    const appleProviderId = await this.resolveProviderId(user.id, user.role);
    const accessToken = await this.jwtService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      appleProviderId,
    );
    const refreshToken = await this.jwtService.generateRefreshToken(
      user.id,
      user.email,
      user.role,
      appleProviderId,
    );

    await this.sessionRepo.create(
      user.id,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified || false,
        profile_picture_url: user.profile_picture_url,
        timezone: user.timezone || "UTC",
        language: user.language || "en",
        last_login_at: user.last_login_at,
      },
    };
  }

  // ==========================================
  // Helper Methods for Future Features
  // ==========================================

  private generateRandomSecret(): string {
    // 32-character base32 secret for TOTP — uses CSPRNG
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const bytes = require("crypto").randomBytes(32);
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  private verifyTOTP(secret: string, code: string): boolean {
    return verifySync({ secret, token: code }).valid;
  }

  private _generateRandomBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(this._generateRandomBackupCode());
    }
    return codes;
  }

  private _generateRandomBackupCode(): string {
    // Format: XXXX-XXXX-XXXX (12 digits) — uses CSPRNG
    const bytes = require("crypto").randomBytes(6);
    const digits = Array.from(bytes as Uint8Array).map((b) => b % 10).join("");
    return digits.replace(/(.{4})/g, "$1-").slice(0, -1);
  }

  private generateSecureToken(length: number): string {
    // Uses CSPRNG — safe for email verification tokens and magic links
    return require("crypto").randomBytes(length).toString("hex").slice(0, length);
  }

  private generateRandomPassword(): string {
    // Uses CSPRNG — safe for auto-generated temporary passwords
    return require("crypto").randomBytes(16).toString("base64").slice(0, 16);
  }

  private async verifyAppleIdentityToken(
    identityToken: string,
  ): Promise<string | null> {
    // Verify JWT signature using Apple's public keys via apple-signin-auth
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { verify } = require("apple-signin-auth");
      const appleClientId = this.configService.get<string>("APPLE_CLIENT_ID");
      const payload = await verify(identityToken, { clientId: appleClientId });
      return payload.sub; // Apple user ID
    } catch (error: any) {
      this.logger.error("Apple token verification failed", {
        error: error.message,
      });
      return null;
    }
  }

  private extractEmailFromAppleToken(identityToken: string): string {
    // Decode JWT payload to extract email (no signature verification)
    try {
      const base64Url = identityToken.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
      const payload = JSON.parse(jsonPayload);
      return payload.email;
    } catch {
      throw new BadRequestException("Cannot extract email from Apple token");
    }
  }
}
