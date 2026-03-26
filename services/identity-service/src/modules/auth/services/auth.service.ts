import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { verifySync } from 'otplib';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { LoginAttemptRepository } from '../repositories/login-attempt.repository';
import { SocialAccountRepository } from '../repositories/social-account.repository';
import { TwoFactorSecretRepository } from "../repositories/two-factor-secret.repository";
import { MagicLinkTokenRepository } from "../repositories/magic-link-token.repository";
import { LoginHistoryRepository } from "../repositories/login-history.repository";
import { AccountDeletionRequestRepository } from "../repositories/account-deletion-request.repository";
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
		private readonly twoFactorSecretRepo: TwoFactorSecretRepository,
		private readonly magicLinkTokenRepo: MagicLinkTokenRepository,
		private readonly loginHistoryRepo: LoginHistoryRepository,
		private readonly accountDeletionRequestRepo: AccountDeletionRequestRepository,
		private readonly jwtService: JwtService,
		private readonly tokenService: TokenService,
		private readonly smsClient: SmsClient,
		private readonly notificationClient: NotificationClient,
		private readonly configService: ConfigService,
		@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
	) {
		this.maxLoginAttempts = parseInt(this.configService.get<string>("MAX_LOGIN_ATTEMPTS", "5"), 10);
	}

	async signup(signupDto: SignupDto, ipAddress?: string): Promise<AuthResponseDto> {
		const { email, password, role, phone, name, timezone, language } = signupDto;

		this.logger.info("Signup attempt", { context: "AuthService", email, role, name });

		// Check if user already exists
		const existingUser = await this.userRepo.findByEmail(email);
		if (existingUser) {
			this.logger.warn("Signup failed: User already exists", { context: "AuthService", email });
			throw new ConflictException("User with this email already exists");
		}

		// Hash password
		const passwordHash = await bcrypt.hash(password, this.saltRounds);

		// Create user with role, phone, name, timezone, and language
		const user = await this.userRepo.create(email, passwordHash, role, phone, name, timezone, language);

		// Generate email verification token (but don't send email in this basic implementation)
		const verificationToken = await this.tokenService.createEmailVerificationToken(user.id);

		this.logger.info("User created successfully", {
			context: "AuthService",
			userId: user.id,
			email: user.email,
			verificationToken, // In production, this would be sent via email
		});

		// Send welcome email
		this.notificationClient
			.sendEmail({
				to: user.email,
				template: "welcome",
				variables: {
					name: user.email.split("@")[0], // Use email username as name
					dashboardUrl: `${this.configService.get<string>("FRONTEND_URL", "http://localhost:3000")}/dashboard`,
				},
			})
			.catch((err) => {
				this.logger.error("Failed to send welcome email", {
					context: "AuthService",
					error: err.message,
					userId: user.id,
				});
			});

		// Send email verification link
		const frontendUrl = this.configService.get<string>("FRONTEND_URL", "http://localhost:3000");
		this.notificationClient
			.sendEmail({
				to: user.email,
				template: "emailVerification",
				variables: {
					name: user.email.split("@")[0],
					verificationUrl: `${frontendUrl}/verify-email?token=${verificationToken}`,
				},
			})
			.catch((err) => {
				this.logger.error("Failed to send verification email", {
					context: "AuthService",
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
				timezone: user.timezone || "UTC",
				language: user.language || "en",
				last_login_at: user.last_login_at,
			},
		};
	}

	async login(loginDto: LoginDto, ipAddress?: string): Promise<AuthResponseDto> {
		const { email, password } = loginDto;

		this.logger.info("Login attempt", { context: "AuthService", email, ipAddress });

		// Check failed login attempts
		const failedAttempts = await this.loginAttemptRepo.countRecentFailedAttempts(email);
		if (failedAttempts >= this.maxLoginAttempts) {
			this.logger.warn("Login blocked: Too many failed attempts", { context: "AuthService", email, failedAttempts });
			throw new TooManyRequestsException("Too many failed login attempts. Please try again later.");
		}

		// Find user
		const user = await this.userRepo.findByEmail(email);
		if (!user || !user.password_hash) {
			await this.loginAttemptRepo.create(email, false, ipAddress);
			this.logger.warn("Login failed: Invalid credentials", { context: "AuthService", email });
			throw new UnauthorizedException("Invalid credentials");
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.password_hash);
		if (!isPasswordValid) {
			await this.loginAttemptRepo.create(email, false, ipAddress);
			this.logger.warn("Login failed: Invalid password", { context: "AuthService", email });
			throw new UnauthorizedException("Invalid credentials");
		}

		// Check if account is active
		if (user.status !== "active") {
			this.logger.warn("Login failed: Account not active", { context: "AuthService", email, status: user.status });
			throw new UnauthorizedException("Account is not active");
		}

		// Record successful login
		await this.loginAttemptRepo.create(email, true, ipAddress);

		// ✅ NEW: Update last login timestamp
		await this.userRepo.updateLastLogin(user.id);

		this.logger.info("Login successful", { context: "AuthService", userId: user.id, email: user.email });

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
				timezone: user.timezone || "UTC",
				language: user.language || "en",
				last_login_at: user.last_login_at,
			},
		};
	}

	async logout(refreshToken: string): Promise<void> {
		this.logger.info("Logout attempt", { context: "AuthService" });

		await this.sessionRepo.deleteByRefreshToken(refreshToken);

		this.logger.info("Logout successful", { context: "AuthService" });
	}

	async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
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
			const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role);

			return { accessToken };
		} catch (error) {
			this.logger.error("Refresh token failed", { context: "AuthService", error: error.message });
			throw new UnauthorizedException("Invalid refresh token");
		}
	}

	async requestPasswordReset(email: string): Promise<void> {
		this.logger.info("Password reset requested", { context: "AuthService", email });

		const user = await this.userRepo.findByEmail(email);
		if (!user) {
			// Don't reveal if user exists
			this.logger.warn("Password reset requested for non-existent user", { context: "AuthService", email });
			return;
		}

		const resetToken = await this.tokenService.createPasswordResetToken(user.id);

		this.logger.info("Password reset token created", {
			context: "AuthService",
			userId: user.id,
			resetToken, // In production, this would be sent via email
		});

		// In production, send email with reset link containing the token
	}

	async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
		this.logger.info("Password reset confirmation attempt", { context: "AuthService" });

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

		this.logger.info("Password reset successful", { context: "AuthService", userId });
	}

	async verifyEmail(token: string): Promise<void> {
		this.logger.info("Email verification attempt", { context: "AuthService" });

		const userId = await this.tokenService.verifyEmailToken(token);
		if (!userId) {
			throw new BadRequestException("Invalid or expired verification token");
		}

		await this.userRepo.verifyEmail(userId);

		this.logger.info("Email verified successfully", { context: "AuthService", userId });
	}

	/**
	 * Handle OAuth login (Google, Facebook)
	 * Creates user if doesn't exist, links social account if exists
	 */
	async handleOAuthLogin(oauthUser: OAuthUserDto, ipAddress?: string): Promise<AuthResponseDto> {
		const { provider, providerId, email, name, accessToken, refreshToken } = oauthUser;

		this.logger.info("OAuth login attempt", { context: "AuthService", provider, email });

		// Check if social account already exists
		let socialAccount = await this.socialAccountRepo.findByProvider(provider, providerId);
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
			await this.socialAccountRepo.updateTokens(socialAccount.id, accessToken, refreshToken);

			this.logger.info("OAuth login: Existing social account", { context: "AuthService", userId: user.id, provider });
		} else {
			// Social account doesn't exist, check if user exists with this email
			user = await this.userRepo.findByEmail(email);

			if (user) {
				// User exists, link social account
				socialAccount = await this.socialAccountRepo.create(user.id, provider, providerId, accessToken, refreshToken);

				this.logger.info("OAuth login: Linked social account to existing user", {
					context: "AuthService",
					userId: user.id,
					provider,
				});
			} else {
				// Create new user with OAuth
				// No password needed for OAuth users
				user = await this.userRepo.create(
					email,
					null, // No password for OAuth users
					"customer", // Default role
					null, // No phone initially
				);

				// Mark email as verified since OAuth provides verified email
				await this.userRepo.verifyEmail(user.id);

				// Create social account link
				socialAccount = await this.socialAccountRepo.create(user.id, provider, providerId, accessToken, refreshToken);

				this.logger.info("OAuth login: Created new user with social account", {
					context: "AuthService",
					userId: user.id,
					provider,
				});
			}
		}

		// Generate JWT tokens
		const jwtAccessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role);
		const jwtRefreshToken = this.jwtService.generateRefreshToken(user.id, user.email, user.role);

		// Store refresh token in session
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
		await this.sessionRepo.create(user.id, jwtRefreshToken, expiresAt, ipAddress);

		this.logger.info("OAuth login successful", { context: "AuthService", userId: user.id, provider });

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
				timezone: user.timezone || "UTC",
				language: user.language || "en",
				last_login_at: user.last_login_at,
			},
		};
	}

	/**
	 * Login with phone and password
	 */
	async loginWithPhone(phone: string, password: string, ipAddress?: string): Promise<AuthResponseDto> {
		this.logger.info("Phone login attempt", { context: "AuthService", phone, ipAddress });

		// Check failed login attempts
		const failedAttempts = await this.loginAttemptRepo.countRecentFailedAttempts(phone);
		if (failedAttempts >= this.maxLoginAttempts) {
			this.logger.warn("Phone login blocked: Too many failed attempts", {
				context: "AuthService",
				phone,
				failedAttempts,
			});
			throw new TooManyRequestsException("Too many failed login attempts. Please try again later.");
		}

		// Find user by phone
		const user = await this.userRepo.findByPhone(phone);
		if (!user || !user.password_hash) {
			await this.loginAttemptRepo.create(phone, false, ipAddress);
			this.logger.warn("Phone login failed: Invalid credentials", { context: "AuthService", phone });
			throw new UnauthorizedException("Invalid credentials");
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.password_hash);
		if (!isPasswordValid) {
			await this.loginAttemptRepo.create(phone, false, ipAddress);
			this.logger.warn("Phone login failed: Invalid password", { context: "AuthService", phone });
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

		// Record successful login
		await this.loginAttemptRepo.create(phone, true, ipAddress);

		this.logger.info("Phone login successful", { context: "AuthService", userId: user.id, phone });

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
		this.logger.info("OTP request for phone login", { context: "AuthService", phone });

		// Check if SMS service is enabled
		if (!this.isOtpServiceAvailable("phone")) {
			this.logger.warn("OTP request attempted but SMS service is disabled", { context: "AuthService", phone });
			throw new BadRequestException("SMS service is currently unavailable. Please use password login instead.");
		}

		// Check if user exists with this phone
		const user = await this.userRepo.findByPhone(phone);
		if (!user) {
			// Don't reveal if user exists
			this.logger.warn("OTP requested for non-existent phone", { context: "AuthService", phone });
			// Still return success to avoid user enumeration
			return { message: "If the phone number is registered, an OTP has been sent" };
		}

		// Check if account is active
		if (user.status !== "active") {
			this.logger.warn("OTP request for inactive account", { context: "AuthService", phone, status: user.status });
			throw new UnauthorizedException("Account is not active");
		}

		try {
			// Send OTP via SMS service
			await this.smsClient.sendOtp(phone, "login");

			this.logger.info("OTP sent successfully", { context: "AuthService", phone });

			return { message: "OTP sent successfully" };
		} catch (error) {
			this.logger.error("Failed to send OTP", { context: "AuthService", phone, error: error.message });
			throw new BadRequestException("Failed to send OTP. Please try again.");
		}
	}

	/**
	 * Verify OTP and login
	 */
	async verifyPhoneOtp(phone: string, code: string, ipAddress?: string): Promise<AuthResponseDto> {
		this.logger.info("OTP verification attempt for phone login", { context: "AuthService", phone });

		// Check if SMS service is enabled
		if (!this.isOtpServiceAvailable("phone")) {
			this.logger.warn("OTP verification attempted but SMS service is disabled", { context: "AuthService", phone });
			throw new BadRequestException("SMS service is currently unavailable. Please use password login instead.");
		}

		// Find user by phone
		const user = await this.userRepo.findByPhone(phone);
		if (!user) {
			this.logger.warn("OTP verification failed: User not found", { context: "AuthService", phone });
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
			const verificationResult = await this.smsClient.verifyOtp(phone, code, "login");

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
					timezone: user.timezone || "UTC",
					language: user.language || "en",
					last_login_at: user.last_login_at,
				},
			};
		} catch (error) {
			this.logger.error("OTP verification error", { context: "AuthService", phone, error: error.message });

			if (error instanceof UnauthorizedException) {
				throw error;
			}

			throw new BadRequestException("OTP verification failed. Please try again.");
		}
	}

	/**
	 * Verify JWT token and return user information (for API Gateway)
	 */
	async verifyTokenAndGetUserInfo(
		token: string,
	): Promise<{ userId: string; email: string; role: string; name?: string; phone?: string }> {
		try {
			// Verify the JWT token
			const payload = this.jwtService.verifyAccessToken(token);

			this.logger.debug("Token verified successfully", { context: "AuthService", userId: payload.sub });

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
			return { userId: user.id, email: user.email, role: user.role, name: user.name, phone: user.phone };
		} catch (error) {
			this.logger.error("Token verification failed", { context: "AuthService", error: error.message });

			throw new UnauthorizedException("Invalid or expired token");
		}
	}

	/**
	 * Check if email or phone exists in the system
	 */
	async checkIdentifierExists(identifier: string, type: "email" | "phone"): Promise<boolean> {
		this.logger.info("Checking identifier existence", { context: "AuthService", type });

		try {
			if (type === "email") {
				const user = await this.userRepo.findByEmail(identifier);
				return !!user;
			} else if (type === "phone") {
				const user = await this.userRepo.findByPhone(identifier);
				return !!user;
			}

			return false;
		} catch (error) {
			this.logger.error("Error checking identifier", { context: "AuthService", type, error: error.message });

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
				const smsEnabled = this.configService.get<string>("SMS_SERVICE_ENABLED", "false") === "true";
				const twilioSid = this.configService.get<string>("TWILIO_ACCOUNT_SID");
				const twilioToken = this.configService.get<string>("TWILIO_AUTH_TOKEN");

				return smsEnabled && !!twilioSid && !!twilioToken;
			} else if (type === "email") {
				// Check if Email service is configured
				const emailEnabled = this.configService.get<string>("EMAIL_SERVICE_ENABLED", "false") === "true";
				const smtpHost = this.configService.get<string>("SMTP_HOST");
				const smtpUser = this.configService.get<string>("SMTP_USER");

				return emailEnabled && !!smtpHost && !!smtpUser;
			}

			return false;
		} catch (error) {
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

	async enable2FA(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
		this.logger.info("2FA enable requested", { context: "AuthService", userId });

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

		this.logger.info("2FA enabled successfully", { context: "AuthService", userId });
	}

	async disable2FA(userId: string, password: string, code?: string): Promise<void> {
		this.logger.info("2FA disable requested", { context: "AuthService", userId });

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

	async generateBackupCodes(userId: string, count: number = 10): Promise<string[]> {
		this.logger.info("Generating backup codes", { context: "AuthService", userId });

		const codes = this._generateRandomBackupCodes(count);
		await this.twoFactorSecretRepo.updateBackupCodes(userId, codes);

		return codes;
	}

	async useBackupCode(userId: string, code: string): Promise<boolean> {
		this.logger.info("Using backup code", { context: "AuthService", userId });

		const consumed = await this.twoFactorSecretRepo.consumeBackupCode(userId, code);
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
		this.logger.info("Revoking session", { context: "AuthService", userId, sessionId });

		// Verify session belongs to user
		const session = await this.sessionRepo.findByUserId(userId);
		const target = session.find((s) => s.id === sessionId);
		if (!target) {
			throw new NotFoundException("Session not found");
		}

		await this.sessionRepo.deleteByRefreshToken(target.refresh_token);
	}

	async revokeAllSessions(userId: string): Promise<void> {
		this.logger.info("Revoking all sessions", { context: "AuthService", userId });

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
		this.logger.info("Removing device", { context: "AuthService", userId, deviceId });

		const query = "DELETE FROM user_devices WHERE user_id = $1 AND device_id = $2";
		await this.sessionRepo["pool"].query(query, [userId, deviceId]);
	}

	/**
	 * ACCOUNT MANAGEMENT
	 */

	async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
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

		this.logger.info("Password changed successfully", { context: "AuthService", userId });
	}

	async resendVerificationEmail(email: string): Promise<void> {
		this.logger.info("Resend verification email", { context: "AuthService", email });

		const user = await this.userRepo.findByEmail(email);
		if (!user) {
			// Don't reveal non-existence
			return;
		}

		if (user.email_verified) {
			throw new BadRequestException("Email already verified");
		}

		const token = await this.tokenService.createEmailVerificationToken(user.id);
		const frontendUrl = this.configService.get<string>("FRONTEND_URL", "http://localhost:3000");

		this.notificationClient
			.sendEmail({
				to: email,
				template: "emailVerification",
				variables: {
					name: user.name || email.split("@")[0],
					verificationUrl: `${frontendUrl}/verify-email?token=${token}`,
				},
			})
			.catch((err) => {
				this.logger.error("Failed to send verification email", { error: err.message });
			});
	}

	async deactivateAccount(userId: string, password: string, reason?: string): Promise<void> {
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

		this.logger.info("Account deactivated", { context: "AuthService", userId, reason });
	}

	async requestAccountDeletion(userId: string, password: string, reason?: string): Promise<void> {
		this.logger.info("Request account deletion", { context: "AuthService", userId });

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

		// Optionally: send confirmation email with 30-day grace period
		this.notificationClient
			.sendEmail({
				to: user.email,
				template: "accountDeletionRequested",
				variables: { name: user.name || user.email.split("@")[0], gracePeriodDays: 30 },
			})
			.catch((err) => this.logger.error("Failed to send deletion email", { error: err.message }));
	}

	async cancelAccountDeletion(userId: string, password: string): Promise<void> {
		this.logger.info("Cancel account deletion", { context: "AuthService", userId });

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

	async getLoginHistory(userId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
		this.logger.info("Fetching login history", { context: "AuthService", userId });

		return await this.loginHistoryRepo.findByUserId(userId, limit, offset);
	}

	/**
	 * SOCIAL ACCOUNT LINKING
	 */

	async getLinkedSocialAccounts(userId: string): Promise<any[]> {
		this.logger.info("Fetching linked social accounts", { context: "AuthService", userId });

		return await this.socialAccountRepo.findByUserId(userId);
	}

	async linkSocialAccount(
		userId: string,
		provider: "google" | "facebook",
		providerUserId: string,
		accessToken: string,
		refreshToken?: string,
	): Promise<void> {
		this.logger.info("Linking social account", { context: "AuthService", userId, provider });

		// Check if already linked
		const existing = await this.socialAccountRepo.findByProvider(provider, providerUserId);
		if (existing) {
			throw new ConflictException("This social account is already linked to another user");
		}

		await this.socialAccountRepo.create(userId, provider, providerUserId, accessToken, refreshToken);
	}

	async unlinkSocialAccount(userId: string, provider: string): Promise<void> {
		this.logger.info("Unlinking social account", { context: "AuthService", userId, provider });

		await this.socialAccountRepo.delete(userId, provider);
	}

	/**
	 * MAGIC LINK (PASSWORDLESS)
	 */

	async requestMagicLink(email: string, redirectUrl?: string): Promise<{ message: string }> {
		this.logger.info("Magic link requested", { context: "AuthService", email });

		// Check if user exists (optional: allow guest magic link)
		const user = await this.userRepo.findByEmail(email);

		// Generate token
		const token = this.generateSecureToken(32);
		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

		await this.magicLinkTokenRepo.create(email, token, expiresAt, user?.id);

		// Send email with magic link
		const frontendUrl = redirectUrl || this.configService.get<string>("FRONTEND_URL", "http://localhost:3000");
		const magicLink = `${frontendUrl}/auth/magic-link?token=${token}`;

		this.notificationClient
			.sendEmail({
				to: email,
				template: "magicLink",
				variables: { name: user?.name || email.split("@")[0], magicLink },
			})
			.catch((err) => {
				this.logger.error("Failed to send magic link email", { error: err.message });
			});

		return { message: "Magic link sent if email is registered" };
	}

	async verifyMagicLink(token: string, ipAddress?: string): Promise<AuthResponseDto> {
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
			user = await this.userRepo.create(magicLink.email, passwordHash, "customer");
		}

		if (!user) {
			throw new NotFoundException("User not found");
		}

		// Generate tokens
		const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role);
		const refreshToken = this.jwtService.generateRefreshToken(user.id, user.email, user.role);

		await this.sessionRepo.create(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), ipAddress);

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
		let socialAccount = await this.socialAccountRepo.findByProvider("apple", appleUserId);
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
				await this.socialAccountRepo.create(user.id, "apple", appleUserId, identityToken, authorizationCode);
			} else {
				// Create new user
				let name;
				if (fullName) {
					try {
						const nameObj = JSON.parse(fullName);
						name = `${nameObj.givenName || ""} ${nameObj.familyName || ""}`.trim();
					} catch {
						name = fullName;
					}
				}
				user = await this.userRepo.create(email, null, "customer", undefined, name);
				await this.userRepo.verifyEmail(user.id); // Apple provides verified email
				await this.socialAccountRepo.create(user.id, "apple", appleUserId, identityToken, authorizationCode);
			}
		}

		// Generate tokens
		const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role);
		const refreshToken = this.jwtService.generateRefreshToken(user.id, user.email, user.role);

		await this.sessionRepo.create(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), ipAddress);

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
		// 32-character base32 secret for TOTP
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
		let result = "";
		for (let i = 0; i < 32; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}

	private verifyTOTP(secret: string, code: string): boolean {
		// Use otplib for TOTP verification
		const result = verifySync({
			secret,
			token: code,
			period: 30, // 30-second time step
		});
		return result.valid;
	}

	private _generateRandomBackupCodes(count: number): string[] {
		const codes: string[] = [];
		for (let i = 0; i < count; i++) {
			codes.push(this._generateRandomBackupCode());
		}
		return codes;
	}

	private _generateRandomBackupCode(): string {
		// Format: XXXX-XXXX-XXXX (12 digits)
		const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");
		return digits.replace(/(.{4})/g, "$1-").slice(0, -1);
	}

	private generateSecureToken(length: number): string {
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let result = "";
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}

	private generateRandomPassword(): string {
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
		let result = "";
		for (let i = 0; i < 16; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}

	private async verifyAppleIdentityToken(identityToken: string): Promise<string | null> {
		// Verify JWT signature using Apple's public keys via apple-signin-auth
		try {
			const { verify } = require('apple-signin-auth');
			const appleClientId = this.configService.get<string>('APPLE_CLIENT_ID');
			const payload = await verify(identityToken, { clientId: appleClientId });
			return payload.sub; // Apple user ID
		} catch (error) {
			this.logger.error("Apple token verification failed", { error: error.message });
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
