import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { LoginAttemptRepository } from '../repositories/login-attempt.repository';
import { SocialAccountRepository } from '../repositories/social-account.repository';
import { JwtService } from './jwt.service';
import { TokenService } from './token.service';
import { SmsClient } from '../clients/sms.client';
import { NotificationClient } from '../../../common/notification/notification.client';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { OAuthUserDto } from '../dto/oauth-user.dto';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  TooManyRequestsException,
  NotFoundException,
} from '@/common/exceptions/http.exceptions';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;
  private readonly maxLoginAttempts: number;

  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly loginAttemptRepo: LoginAttemptRepository,
    private readonly socialAccountRepo: SocialAccountRepository,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly smsClient: SmsClient,
    private readonly notificationClient: NotificationClient,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.maxLoginAttempts = parseInt(
      this.configService.get<string>('MAX_LOGIN_ATTEMPTS', '5'),
      10,
    );
  }

  async signup(signupDto: SignupDto, ipAddress?: string): Promise<AuthResponseDto> {
    const { email, password, role, phone, name, timezone, language } = signupDto;

    this.logger.info('Signup attempt', { context: 'AuthService', email, role, name });

    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      this.logger.warn('Signup failed: User already exists', {
        context: 'AuthService',
        email,
      });
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.saltRounds);

    // Create user with role, phone, name, timezone, and language
    const user = await this.userRepo.create(email, passwordHash, role, phone, name, timezone, language);

    // Generate email verification token (but don't send email in this basic implementation)
    const verificationToken = await this.tokenService.createEmailVerificationToken(user.id);
    
    this.logger.info('User created successfully', {
      context: 'AuthService',
      userId: user.id,
      email: user.email,
      verificationToken, // In production, this would be sent via email
    });

    // Send welcome email
    this.notificationClient.sendEmail({
      to: user.email,
      template: 'welcome',
      variables: {
        name: user.email.split('@')[0], // Use email username as name
        dashboardUrl: `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/dashboard`,
      },
    }).catch(err => {
      this.logger.error('Failed to send welcome email', {
        context: 'AuthService',
        error: err.message,
        userId: user.id,
      });
    });

    // Send email verification link
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    this.notificationClient.sendEmail({
      to: user.email,
      template: 'emailVerification',
      variables: {
        name: user.email.split('@')[0],
        verificationUrl: `${frontendUrl}/verify-email?token=${verificationToken}`,
      },
    }).catch(err => {
      this.logger.error('Failed to send verification email', {
        context: 'AuthService',
        error: err.message,
        userId: user.id,
      });
    });

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = this.jwtService.generateRefreshToken(user.id, user.email, user.role);

    // Store refresh token in session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await this.sessionRepo.create(user.id, refreshToken, expiresAt, ipAddress);

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
        timezone: user.timezone || 'UTC',
        language: user.language || 'en',
        last_login_at: user.last_login_at,
      },
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    this.logger.info('Login attempt', { context: 'AuthService', email, ipAddress });

    // Check failed login attempts
    const failedAttempts = await this.loginAttemptRepo.countRecentFailedAttempts(email);
    if (failedAttempts >= this.maxLoginAttempts) {
      this.logger.warn('Login blocked: Too many failed attempts', {
        context: 'AuthService',
        email,
        failedAttempts,
      });
      throw new TooManyRequestsException(
        'Too many failed login attempts. Please try again later.',
      );
    }

    // Find user
    const user = await this.userRepo.findByEmail(email);
    if (!user || !user.password_hash) {
      await this.loginAttemptRepo.create(email, false, ipAddress);
      this.logger.warn('Login failed: Invalid credentials', {
        context: 'AuthService',
        email,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await this.loginAttemptRepo.create(email, false, ipAddress);
      this.logger.warn('Login failed: Invalid password', {
        context: 'AuthService',
        email,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (user.status !== 'active') {
      this.logger.warn('Login failed: Account not active', {
        context: 'AuthService',
        email,
        status: user.status,
      });
      throw new UnauthorizedException('Account is not active');
    }

    // Record successful login
    await this.loginAttemptRepo.create(email, true, ipAddress);

    // ✅ NEW: Update last login timestamp
    await this.userRepo.updateLastLogin(user.id);

    this.logger.info('Login successful', {
      context: 'AuthService',
      userId: user.id,
      email: user.email,
    });

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = this.jwtService.generateRefreshToken(user.id, user.email, user.role);

    // Store refresh token in session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await this.sessionRepo.create(user.id, refreshToken, expiresAt, ipAddress);

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
        timezone: user.timezone || 'UTC',
        language: user.language || 'en',
        last_login_at: user.last_login_at,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    this.logger.info('Logout attempt', { context: 'AuthService' });
    
    await this.sessionRepo.deleteByRefreshToken(refreshToken);
    
    this.logger.info('Logout successful', { context: 'AuthService' });
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verifyRefreshToken(refreshToken);

      // Check if session exists
      const session = await this.sessionRepo.findByRefreshToken(refreshToken);
      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if session is expired
      if (new Date() > new Date(session.expires_at)) {
        await this.sessionRepo.deleteByRefreshToken(refreshToken);
        throw new UnauthorizedException('Refresh token expired');
      }

      // Get user
      const user = await this.userRepo.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      const accessToken = this.jwtService.generateAccessToken(
        user.id,
        user.email,
        user.role,
      );

      return { accessToken };
    } catch (error) {
      this.logger.error('Refresh token failed', {
        context: 'AuthService',
        error: error.message,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    this.logger.info('Password reset requested', { context: 'AuthService', email });

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      this.logger.warn('Password reset requested for non-existent user', {
        context: 'AuthService',
        email,
      });
      return;
    }

    const resetToken = await this.tokenService.createPasswordResetToken(user.id);
    
    this.logger.info('Password reset token created', {
      context: 'AuthService',
      userId: user.id,
      resetToken, // In production, this would be sent via email
    });

    // In production, send email with reset link containing the token
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    this.logger.info('Password reset confirmation attempt', { context: 'AuthService' });

    const userId = await this.tokenService.verifyPasswordResetToken(token);
    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

    // Update password
    await this.userRepo.updatePassword(userId, passwordHash);

    // Delete all sessions for this user (force re-login)
    await this.sessionRepo.deleteByUserId(userId);

    this.logger.info('Password reset successful', {
      context: 'AuthService',
      userId,
    });
  }

  async verifyEmail(token: string): Promise<void> {
    this.logger.info('Email verification attempt', { context: 'AuthService' });

    const userId = await this.tokenService.verifyEmailToken(token);
    if (!userId) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.userRepo.verifyEmail(userId);

    this.logger.info('Email verified successfully', {
      context: 'AuthService',
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
    const { provider, providerId, email, name, accessToken, refreshToken } = oauthUser;

    this.logger.info('OAuth login attempt', {
      context: 'AuthService',
      provider,
      email,
    });

    // Check if social account already exists
    let socialAccount = await this.socialAccountRepo.findByProvider(provider, providerId);
    let user;

    if (socialAccount) {
      // Social account exists, get the user
      user = await this.userRepo.findById(socialAccount.user_id);
      
      if (!user) {
        this.logger.error('Social account exists but user not found', {
          context: 'AuthService',
          socialAccountId: socialAccount.id,
        });
        throw new NotFoundException('User not found');
      }

      // Update tokens
      await this.socialAccountRepo.updateTokens(
        socialAccount.id,
        accessToken,
        refreshToken,
      );

      this.logger.info('OAuth login: Existing social account', {
        context: 'AuthService',
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

        this.logger.info('OAuth login: Linked social account to existing user', {
          context: 'AuthService',
          userId: user.id,
          provider,
        });
      } else {
        // Create new user with OAuth
        // No password needed for OAuth users
        user = await this.userRepo.create(
          email,
          null, // No password for OAuth users
          'customer', // Default role
          null, // No phone initially
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

        this.logger.info('OAuth login: Created new user with social account', {
          context: 'AuthService',
          userId: user.id,
          provider,
        });
      }
    }

    // Generate JWT tokens
    const jwtAccessToken = this.jwtService.generateAccessToken(
      user.id,
      user.email,
      user.role,
    );
    const jwtRefreshToken = this.jwtService.generateRefreshToken(
      user.id,
      user.email,
      user.role,
    );

    // Store refresh token in session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await this.sessionRepo.create(user.id, jwtRefreshToken, expiresAt, ipAddress);

    this.logger.info('OAuth login successful', {
      context: 'AuthService',
      userId: user.id,
      provider,
    });

    return {
      accessToken: jwtAccessToken,
      refreshToken: jwtRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified || false,
        profile_picture_url: user.profile_picture_url,
        timezone: user.timezone || 'UTC',
        language: user.language || 'en',
        last_login_at: user.last_login_at,
      },
    };
  }

  /**
   * Login with phone and password
   */
  async loginWithPhone(phone: string, password: string, ipAddress?: string): Promise<AuthResponseDto> {
    this.logger.info('Phone login attempt', { context: 'AuthService', phone, ipAddress });

    // Check failed login attempts
    const failedAttempts = await this.loginAttemptRepo.countRecentFailedAttempts(phone);
    if (failedAttempts >= this.maxLoginAttempts) {
      this.logger.warn('Phone login blocked: Too many failed attempts', {
        context: 'AuthService',
        phone,
        failedAttempts,
      });
      throw new TooManyRequestsException(
        'Too many failed login attempts. Please try again later.',
      );
    }

    // Find user by phone
    const user = await this.userRepo.findByPhone(phone);
    if (!user || !user.password_hash) {
      await this.loginAttemptRepo.create(phone, false, ipAddress);
      this.logger.warn('Phone login failed: Invalid credentials', {
        context: 'AuthService',
        phone,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await this.loginAttemptRepo.create(phone, false, ipAddress);
      this.logger.warn('Phone login failed: Invalid password', {
        context: 'AuthService',
        phone,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (user.status !== 'active') {
      this.logger.warn('Phone login failed: Account not active', {
        context: 'AuthService',
        phone,
        status: user.status,
      });
      throw new UnauthorizedException('Account is not active');
    }

    // Record successful login
    await this.loginAttemptRepo.create(phone, true, ipAddress);

    this.logger.info('Phone login successful', {
      context: 'AuthService',
      userId: user.id,
      phone,
    });

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = this.jwtService.generateRefreshToken(user.id, user.email, user.role);

    // Store refresh token in session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await this.sessionRepo.create(user.id, refreshToken, expiresAt, ipAddress);

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
        timezone: user.timezone || 'UTC',
        language: user.language || 'en',
        last_login_at: user.last_login_at,
      },
    };
  }

  /**
   * Request OTP for phone login
   */
  async requestPhoneOtp(phone: string): Promise<{ message: string }> {
    this.logger.info('OTP request for phone login', { context: 'AuthService', phone });

    // Check if SMS service is enabled
    if (!this.isOtpServiceAvailable('phone')) {
      this.logger.warn('OTP request attempted but SMS service is disabled', {
        context: 'AuthService',
        phone,
      });
      throw new BadRequestException(
        'SMS service is currently unavailable. Please use password login instead.'
      );
    }

    // Check if user exists with this phone
    const user = await this.userRepo.findByPhone(phone);
    if (!user) {
      // Don't reveal if user exists
      this.logger.warn('OTP requested for non-existent phone', {
        context: 'AuthService',
        phone,
      });
      // Still return success to avoid user enumeration
      return { message: 'If the phone number is registered, an OTP has been sent' };
    }

    // Check if account is active
    if (user.status !== 'active') {
      this.logger.warn('OTP request for inactive account', {
        context: 'AuthService',
        phone,
        status: user.status,
      });
      throw new UnauthorizedException('Account is not active');
    }

    try {
      // Send OTP via SMS service
      await this.smsClient.sendOtp(phone, 'login');
      
      this.logger.info('OTP sent successfully', {
        context: 'AuthService',
        phone,
      });

      return { message: 'OTP sent successfully' };
    } catch (error) {
      this.logger.error('Failed to send OTP', {
        context: 'AuthService',
        phone,
        error: error.message,
      });
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Verify OTP and login
   */
  async verifyPhoneOtp(phone: string, code: string, ipAddress?: string): Promise<AuthResponseDto> {
    this.logger.info('OTP verification attempt for phone login', { context: 'AuthService', phone });

    // Check if SMS service is enabled
    if (!this.isOtpServiceAvailable('phone')) {
      this.logger.warn('OTP verification attempted but SMS service is disabled', {
        context: 'AuthService',
        phone,
      });
      throw new BadRequestException(
        'SMS service is currently unavailable. Please use password login instead.'
      );
    }

    // Find user by phone
    const user = await this.userRepo.findByPhone(phone);
    if (!user) {
      this.logger.warn('OTP verification failed: User not found', {
        context: 'AuthService',
        phone,
      });
      throw new UnauthorizedException('Invalid phone number or OTP');
    }

    // Check if account is active
    if (user.status !== 'active') {
      this.logger.warn('OTP verification failed: Account not active', {
        context: 'AuthService',
        phone,
        status: user.status,
      });
      throw new UnauthorizedException('Account is not active');
    }

    try {
      // Verify OTP via SMS service
      const verificationResult = await this.smsClient.verifyOtp(phone, code, 'login');
      
      if (!verificationResult.valid) {
        this.logger.warn('OTP verification failed: Invalid code', {
          context: 'AuthService',
          phone,
          message: verificationResult.message,
        });
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      this.logger.info('OTP verification successful, logging in user', {
        context: 'AuthService',
        userId: user.id,
        phone,
      });

      // Generate tokens
      const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role);
      const refreshToken = this.jwtService.generateRefreshToken(user.id, user.email, user.role);

      // Store refresh token in session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
      await this.sessionRepo.create(user.id, refreshToken, expiresAt, ipAddress);

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
          timezone: user.timezone || 'UTC',
          language: user.language || 'en',
          last_login_at: user.last_login_at,
        },
      };
    } catch (error) {
      this.logger.error('OTP verification error', {
        context: 'AuthService',
        phone,
        error: error.message,
      });
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new BadRequestException('OTP verification failed. Please try again.');
    }
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

      this.logger.debug('Token verified successfully', {
        context: 'AuthService',
        userId: payload.sub,
      });

      // Fetch additional user info from database
      const user = await this.userRepo.findById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if account is active
      if (user.status !== 'active') {
        throw new UnauthorizedException('Account is not active');
      }

      // Return user information
      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
      };
    } catch (error) {
      this.logger.error('Token verification failed', {
        context: 'AuthService',
        error: error.message,
      });
      
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Check if email or phone exists in the system
   */
  async checkIdentifierExists(identifier: string, type: 'email' | 'phone'): Promise<boolean> {
    this.logger.info('Checking identifier existence', {
      context: 'AuthService',
      type,
    });

    try {
      if (type === 'email') {
        const user = await this.userRepo.findByEmail(identifier);
        return !!user;
      } else if (type === 'phone') {
        const user = await this.userRepo.findByPhone(identifier);
        return !!user;
      }
      
      return false;
    } catch (error) {
      this.logger.error('Error checking identifier', {
        context: 'AuthService',
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
  isOtpServiceAvailable(type: 'email' | 'phone'): boolean {
    try {
      if (type === 'phone') {
        // Check if SMS service is configured
        const smsEnabled = this.configService.get<string>('SMS_SERVICE_ENABLED', 'false') === 'true';
        const twilioSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const twilioToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        
        return smsEnabled && !!twilioSid && !!twilioToken;
      } else if (type === 'email') {
        // Check if Email service is configured
        const emailEnabled = this.configService.get<string>('EMAIL_SERVICE_ENABLED', 'false') === 'true';
        const smtpHost = this.configService.get<string>('SMTP_HOST');
        const smtpUser = this.configService.get<string>('SMTP_USER');
        
        return emailEnabled && !!smtpHost && !!smtpUser;
      }
      
      return false;
    } catch (error) {
      this.logger.error('Error checking OTP service availability', {
        context: 'AuthService',
        type,
        error: error.message,
      });
      return false;
    }
  }
}
