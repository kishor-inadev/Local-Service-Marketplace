import {
	Controller,
	Post,
	Body,
	Ip,
	Inject,
	Get,
	UseGuards,
	Req,
	Res,
	Headers,
	UnauthorizedException,
	Delete,
	Param,
	Query,
	BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { AuthService } from "../services/auth.service";
import { SignupDto } from "../dto/signup.dto";
import { LoginDto } from "../dto/login.dto";
import { PasswordResetRequestDto } from "../dto/password-reset-request.dto";
import { PasswordResetConfirmDto } from "../dto/password-reset-confirm.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { PhoneLoginDto } from "../dto/phone-login.dto";
import { PhoneOtpRequestDto } from "../dto/phone-otp-request.dto";
import { PhoneOtpVerifyDto } from "../dto/phone-otp-verify.dto";
import { AuthResponseDto } from "../dto/auth-response.dto";
import { OAuthUserDto } from "../dto/oauth-user.dto";
import { VerifyTokenDto, VerifyTokenResponseDto } from "../dto/verify-token.dto";
import { CheckIdentifierDto, CheckIdentifierResponseDto } from "../dto/check-identifier.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
// Future feature DTOs (uncomment when implementing)
// import { Enable2faDto } from '../dto/2fa.dto';
// import { ChangePasswordDto } from '../dto/account-management.dto';
// import { ResendVerificationEmailDto } from '../dto/account-management.dto';
// import { DeactivateAccountDto } from '../dto/account-management.dto';
// import { CancelAccountDeletionDto } from '../dto/account-management.dto';
// import { SocialLinkDto } from '../dto/account-management.dto';
// import { MagicLinkRequestDto } from '../dto/account-management.dto';
// import { AppleMobileSignInDto } from '../dto/account-management.dto';

@Controller("auth")
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
	) {}

	@Post("signup")
	async signup(
		@Body() signupDto: SignupDto,
		@Ip() ipAddress: string,
		@Res({ passthrough: true }) res: Response,
	): Promise<AuthResponseDto> {
		this.logger.info("POST /auth/signup", { context: "AuthController", email: signupDto.email, ipAddress });
		const result = await this.authService.signup(signupDto, ipAddress);

		// Set tokens as HTTP-only cookies
		this.setAuthCookies(res, result.accessToken, result.refreshToken);

		return result;
	}

	@Post("login")
	async login(
		@Body() loginDto: LoginDto,
		@Ip() ipAddress: string,
		@Res({ passthrough: true }) res: Response,
	): Promise<AuthResponseDto> {
		this.logger.info("POST /auth/login", { context: "AuthController", email: loginDto.email, ipAddress });
		const result = await this.authService.login(loginDto, ipAddress);

		// Set tokens as HTTP-only cookies
		this.setAuthCookies(res, result.accessToken, result.refreshToken);

		return result;
	}

	@Post("logout")
	async logout(
		@Body() refreshTokenDto: RefreshTokenDto,
		@Res({ passthrough: true }) res: Response,
	): Promise<{ message: string }> {
		this.logger.info("POST /auth/logout", { context: "AuthController" });
		await this.authService.logout(refreshTokenDto.refreshToken);

		// Clear cookies
		this.clearAuthCookies(res);

		return { message: "Logged out successfully" };
	}

	@Post("refresh")
	async refresh(
		@Body() refreshTokenDto: RefreshTokenDto,
		@Res({ passthrough: true }) res: Response,
	): Promise<{ accessToken: string }> {
		this.logger.info("POST /auth/refresh", { context: "AuthController" });
		const result = await this.authService.refreshAccessToken(refreshTokenDto.refreshToken);

		// Update access token cookie
		res.cookie("access_token", result.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 15 * 60 * 1000, // 15 minutes
		});

		return result;
	}

	@Post("password-reset/request")
	async requestPasswordReset(@Body() passwordResetRequestDto: PasswordResetRequestDto): Promise<{ message: string }> {
		this.logger.info("POST /auth/password-reset/request", {
			context: "AuthController",
			email: passwordResetRequestDto.email,
		});
		await this.authService.requestPasswordReset(passwordResetRequestDto.email);
		return { message: "Password reset email sent if account exists" };
	}

	@Post("password-reset/confirm")
	async confirmPasswordReset(@Body() passwordResetConfirmDto: PasswordResetConfirmDto): Promise<{ message: string }> {
		this.logger.info("POST /auth/password-reset/confirm", { context: "AuthController" });
		await this.authService.confirmPasswordReset(passwordResetConfirmDto.token, passwordResetConfirmDto.newPassword);
		return { message: "Password reset successful" };
	}

	// ==========================================
	// OAuth Routes
	// ==========================================

	@Get("google")
	@UseGuards(AuthGuard("google"))
	async googleAuth(): Promise<void> {
		// Initiates Google OAuth flow
		// User will be redirected to Google login
	}

	@Get("google/callback")
	@UseGuards(AuthGuard("google"))
	async googleAuthCallback(@Req() req: Request, @Res() res: Response, @Ip() ipAddress: string): Promise<void> {
		const oauthUser = req.user as OAuthUserDto;

		this.logger.info("Google OAuth callback", { context: "AuthController", email: oauthUser.email, ipAddress });

		const authResponse = await this.authService.handleOAuthLogin(oauthUser, ipAddress);

		// Redirect to frontend with token
		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
		const redirectUrl = `${frontendUrl}/auth/callback?token=${authResponse.accessToken}&refresh=${authResponse.refreshToken}`;

		res.redirect(redirectUrl);
	}

	@Get("facebook")
	@UseGuards(AuthGuard("facebook"))
	async facebookAuth(): Promise<void> {
		// Initiates Facebook OAuth flow
		// User will be redirected to Facebook login
	}

	@Get("facebook/callback")
	@UseGuards(AuthGuard("facebook"))
	async facebookAuthCallback(@Req() req: Request, @Res() res: Response, @Ip() ipAddress: string): Promise<void> {
		const oauthUser = req.user as OAuthUserDto;

		this.logger.info("Facebook OAuth callback", { context: "AuthController", email: oauthUser.email, ipAddress });

		const authResponse = await this.authService.handleOAuthLogin(oauthUser, ipAddress);

		// Redirect to frontend with token
		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
		const redirectUrl = `${frontendUrl}/auth/callback?token=${authResponse.accessToken}&refresh=${authResponse.refreshToken}`;

		res.redirect(redirectUrl);
	}

	// ==========================================
	// Phone Login Routes
	// ==========================================

	@Post("phone/login")
	async phoneLogin(
		@Body() phoneLoginDto: PhoneLoginDto,
		@Ip() ipAddress: string,
		@Res({ passthrough: true }) res: Response,
	): Promise<AuthResponseDto> {
		this.logger.info("POST /auth/phone/login", { context: "AuthController", phone: phoneLoginDto.phone, ipAddress });
		const result = await this.authService.loginWithPhone(phoneLoginDto.phone, phoneLoginDto.password, ipAddress);

		// Set tokens as HTTP-only cookies
		this.setAuthCookies(res, result.accessToken, result.refreshToken);

		return result;
	}

	@Post("phone/otp/request")
	async requestPhoneOtp(@Body() phoneOtpRequestDto: PhoneOtpRequestDto): Promise<{ message: string }> {
		this.logger.info("POST /auth/phone/otp/request", { context: "AuthController", phone: phoneOtpRequestDto.phone });
		return this.authService.requestPhoneOtp(phoneOtpRequestDto.phone);
	}

	@Post("phone/otp/verify")
	async verifyPhoneOtp(
		@Body() phoneOtpVerifyDto: PhoneOtpVerifyDto,
		@Ip() ipAddress: string,
		@Res({ passthrough: true }) res: Response,
	): Promise<AuthResponseDto> {
		this.logger.info("POST /auth/phone/otp/verify", {
			context: "AuthController",
			phone: phoneOtpVerifyDto.phone,
			ipAddress,
		});
		const result = await this.authService.verifyPhoneOtp(phoneOtpVerifyDto.phone, phoneOtpVerifyDto.code, ipAddress);

		// Set tokens as HTTP-only cookies
		this.setAuthCookies(res, result.accessToken, result.refreshToken);

		return result;
	}

	// ==========================================
	// Check Identifier (Email/Phone Existence)
	// ==========================================

	@Post("check-identifier")
	async checkIdentifier(@Body() checkIdentifierDto: CheckIdentifierDto): Promise<CheckIdentifierResponseDto> {
		this.logger.info("POST /auth/check-identifier", { context: "AuthController", type: checkIdentifierDto.type });

		const exists = await this.authService.checkIdentifierExists(checkIdentifierDto.identifier, checkIdentifierDto.type);

		// Check if OTP service is available for this type
		const otpAvailable = this.authService.isOtpServiceAvailable(checkIdentifierDto.type);

		// Determine available auth methods
		const availableMethods: ("password" | "otp")[] = ["password"]; // Password always available
		if (otpAvailable && exists) {
			availableMethods.push("otp"); // OTP only if service is enabled AND user exists
		}

		return { exists, type: checkIdentifierDto.type, otpAvailable, availableMethods };
	}

	// ==========================================
	// Email Verification
	// ==========================================

	@Get("email/verify")
	async verifyEmail(
		@Query("token") token: string,
		@Res({ passthrough: true }) res: Response,
	): Promise<{ message: string }> {
		this.logger.info("GET /auth/email/verify", { context: "AuthController" });
		await this.authService.verifyEmail(token);
		// Optionally, could redirect to frontend with success message
		// For now, return JSON response
		return { message: "Email verified successfully" };
	}

	// ==========================================
	// Token Verification (Gateway Internal API)
	// ==========================================

	@Post("verify")
	async verifyToken(
		@Body() verifyTokenDto: VerifyTokenDto,
		@Headers("x-gateway-secret") gatewaySecret: string,
	): Promise<VerifyTokenResponseDto> {
		// Verify this request is from the API Gateway (internal only)
		const expectedSecret = process.env.GATEWAY_INTERNAL_SECRET || "gateway-internal-secret-change-in-production";

		if (gatewaySecret !== expectedSecret) {
			this.logger.warn("Unauthorized token verification attempt", { context: "AuthController" });
			throw new UnauthorizedException("Unauthorized");
		}

		this.logger.debug("POST /auth/verify - Gateway token verification", { context: "AuthController" });

		return this.authService.verifyTokenAndGetUserInfo(verifyTokenDto.token);
	}

	// ==========================================
	// FUTURE FEATURE ROUTES (Not yet implemented)
	// ==========================================

	// TWO-FACTOR AUTHENTICATION (2FA)
	@Post("2fa/enable")
	@UseGuards(JwtAuthGuard)
	async enable2FA(@Req() req: Request): Promise<{ secret: string; qrCodeUrl: string }> {
		return this.authService.enable2FA(req.user["sub"]);
	}

	@Get("2fa/qr-code")
	@UseGuards(JwtAuthGuard)
	async get2FAQRCode(@Req() req: Request): Promise<{ qrCodeUrl: string }> {
		const result = await this.authService.enable2FA(req.user["sub"]);
		return { qrCodeUrl: result.qrCodeUrl };
	}

	@Post("2fa/verify")
	@UseGuards(JwtAuthGuard)
	async verify2FA(@Body() dto: { code: string }, @Req() req: Request): Promise<{ message: string }> {
		await this.authService.verify2FA(req.user["sub"], dto.code);
		return { message: "2FA enabled successfully" };
	}

	@Post("2fa/disable")
	@UseGuards(JwtAuthGuard)
	async disable2FA(
		@Body() dto: { password: string; code?: string },
		@Req() req: Request,
	): Promise<{ message: string }> {
		await this.authService.disable2FA(req.user["sub"], dto.password, dto.code);
		return { message: "2FA disabled successfully" };
	}

	@Post("2fa/backup-codes/generate")
	@UseGuards(JwtAuthGuard)
	async generateBackupCodes(@Req() req: Request): Promise<{ codes: string[] }> {
		const codes = await this.authService.generateBackupCodes(req.user["sub"]);
		return { codes };
	}

	@Post("2fa/backup-codes/verify")
	@UseGuards(JwtAuthGuard)
	async useBackupCode(@Body() dto: { backupCode: string }, @Req() req: Request): Promise<{ success: boolean }> {
		const valid = await this.authService.useBackupCode(req.user["sub"], dto.backupCode);
		return { success: valid };
	}

	// SESSION & DEVICE MANAGEMENT
	@Get("sessions")
	@UseGuards(JwtAuthGuard)
	async getSessions(@Req() req: Request): Promise<any[]> {
		return this.authService.getSessions(req.user["sub"]);
	}

	@Delete("sessions/:sessionId")
	@UseGuards(JwtAuthGuard)
	async revokeSession(@Req() req: Request, @Param("sessionId") sessionId: string): Promise<{ message: string }> {
		await this.authService.revokeSession(req.user["sub"], sessionId);
		return { message: "Session revoked" };
	}

	@Delete("sessions/all")
	@UseGuards(JwtAuthGuard)
	async revokeAllSessions(@Req() req: Request): Promise<{ message: string }> {
		await this.authService.revokeAllSessions(req.user["sub"]);
		return { message: "All sessions revoked" };
	}

	@Get("devices")
	@UseGuards(JwtAuthGuard)
	async getDevices(@Req() req: Request): Promise<any[]> {
		return this.authService.getDevices(req.user["sub"]);
	}

	@Delete("devices/:deviceId")
	@UseGuards(JwtAuthGuard)
	async removeDevice(@Req() req: Request, @Param("deviceId") deviceId: string): Promise<{ message: string }> {
		await this.authService.removeDevice(req.user["sub"], deviceId);
		return { message: "Device removed" };
	}

	// ACCOUNT MANAGEMENT
	@Post("change-password")
	@UseGuards(JwtAuthGuard)
	async changePassword(
		@Body() dto: { currentPassword: string; newPassword: string },
		@Req() req: Request,
	): Promise<{ message: string }> {
		await this.authService.changePassword(req.user["sub"], dto.currentPassword, dto.newPassword);
		return { message: "Password changed successfully" };
	}

	@Post("email/resend-verification")
	async resendVerificationEmail(@Body() dto: { email: string }): Promise<{ message: string }> {
		await this.authService.resendVerificationEmail(dto.email);
		return { message: "Verification email sent if email is registered and not verified" };
	}

	@Post("account/deactivate")
	@UseGuards(JwtAuthGuard)
	async deactivateAccount(
		@Body() dto: { password: string; reason?: string },
		@Req() req: Request,
	): Promise<{ message: string }> {
		await this.authService.deactivateAccount(req.user["sub"], dto.password, dto.reason);
		return { message: "Account deactivated" };
	}

	@Delete("account")
	@UseGuards(JwtAuthGuard)
	async requestAccountDeletion(
		@Body() dto: { password: string; reason?: string },
		@Req() req: Request,
	): Promise<{ message: string }> {
		await this.authService.requestAccountDeletion(req.user["sub"], dto.password, dto.reason);
		return { message: "Account deletion requested. You have 30 days to cancel." };
	}

	@Post("account/cancel-deletion")
	@UseGuards(JwtAuthGuard)
	async cancelAccountDeletion(@Body() dto: { password: string }, @Req() req: Request): Promise<{ message: string }> {
		await this.authService.cancelAccountDeletion(req.user["sub"], dto.password);
		return { message: "Account deletion cancelled" };
	}

	@Get("login-history")
	@UseGuards(JwtAuthGuard)
	async getLoginHistory(
		@Req() req: Request,
		@Query("limit") limit?: string,
		@Query("offset") offset?: string,
	): Promise<any[]> {
		return this.authService.getLoginHistory(
			req.user["sub"],
			limit ? parseInt(limit, 10) : 50,
			offset ? parseInt(offset, 10) : 0,
		);
	}

	// SOCIAL ACCOUNT LINKING
	@Get("social/accounts")
	@UseGuards(JwtAuthGuard)
	async getLinkedSocialAccounts(@Req() req: Request): Promise<any[]> {
		return this.authService.getLinkedSocialAccounts(req.user["sub"]);
	}

	@Post("social/link/:provider")
	@UseGuards(JwtAuthGuard)
	async linkSocialAccount(
		@Req() req: Request,
		@Param("provider") provider: string,
		@Body() dto: { idToken?: string; accessToken?: string },
	): Promise<{ message: string }> {
		if (!dto.idToken && !dto.accessToken) {
			throw new BadRequestException("Either idToken or accessToken is required");
		}
		const providerUserId = dto.idToken || dto.accessToken!;
		await this.authService.linkSocialAccount(
			req.user["sub"],
			provider as "google" | "facebook",
			providerUserId,
			dto.idToken || dto.accessToken!,
		);
		return { message: `${provider} account linked successfully` };
	}

	@Delete("social/unlink/:provider")
	@UseGuards(JwtAuthGuard)
	async unlinkSocialAccount(@Req() req: Request, @Param("provider") provider: string): Promise<{ message: string }> {
		await this.authService.unlinkSocialAccount(req.user["sub"], provider);
		return { message: `${provider} account unlinked` };
	}

	// MAGIC LINK (PASSWORDLESS)
	@Post("magic-link/request")
	async requestMagicLink(@Body() dto: { email: string; redirectUrl?: string }): Promise<{ message: string }> {
		return this.authService.requestMagicLink(dto.email, dto.redirectUrl);
	}

	@Get("magic-link/verify")
	async verifyMagicLink(
		@Query("token") token: string,
		@Ip() ipAddress: string,
		@Res({ passthrough: true }) res: Response,
	): Promise<AuthResponseDto> {
		const result = await this.authService.verifyMagicLink(token, ipAddress);
		this.setAuthCookies(res, result.accessToken, result.refreshToken);
		return result;
	}

	// APPLE SIGN IN
	@Get("apple")
	@UseGuards(AuthGuard("apple"))
	async appleAuth(): Promise<void> {
		// Initiates Apple OAuth flow
	}

	@Get("apple/callback")
	@UseGuards(AuthGuard("apple"))
	async appleAuthCallback(@Req() req: Request, @Res() res: Response, @Ip() ipAddress: string): Promise<void> {
		const oauthUser = req.user as OAuthUserDto;

		this.logger.info("Apple OAuth callback", { context: "AuthController", email: oauthUser.email, ipAddress });

		const authResponse = await this.authService.handleOAuthLogin(oauthUser, ipAddress);

		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
		const redirectUrl = `${frontendUrl}/auth/callback?token=${authResponse.accessToken}&refresh=${authResponse.refreshToken}`;

		res.redirect(redirectUrl);
	}

	@Post("apple/mobile")
	async appleMobileSignIn(
		@Body() dto: { identityToken: string; authorizationCode?: string; fullName?: string },
		@Ip() ipAddress: string,
		@Res({ passthrough: true }) res: Response,
	): Promise<AuthResponseDto> {
		const result = await this.authService.appleMobileSignIn(
			dto.identityToken,
			dto.authorizationCode,
			dto.fullName,
			ipAddress,
		);
		this.setAuthCookies(res, result.accessToken, result.refreshToken);
		return result;
	}

	// ==========================================
	// Helper Methods
	// ==========================================

	private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
		const isProduction = process.env.NODE_ENV === "production";

		// Set access token cookie (15 minutes)
		res.cookie("access_token", accessToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? "strict" : "lax", // 'lax' allows cross-origin in development
			maxAge: 15 * 60 * 1000, // 15 minutes
			path: "/",
		});

		// Set refresh token cookie (7 days)
		res.cookie("refresh_token", refreshToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? "strict" : "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			path: "/",
		});
	}

	private clearAuthCookies(res: Response): void {
		res.clearCookie("access_token", { path: "/" });
		res.clearCookie("refresh_token", { path: "/" });
	}
}
