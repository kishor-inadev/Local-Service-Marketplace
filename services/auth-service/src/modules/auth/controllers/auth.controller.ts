import { Controller, Post, Body, Ip, Inject, Get, UseGuards, Req, Res, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuthService } from '../services/auth.service';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { PasswordResetRequestDto } from '../dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from '../dto/password-reset-confirm.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { PhoneLoginDto } from '../dto/phone-login.dto';
import { PhoneOtpRequestDto } from '../dto/phone-otp-request.dto';
import { PhoneOtpVerifyDto } from '../dto/phone-otp-verify.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { OAuthUserDto } from '../dto/oauth-user.dto';
import { VerifyTokenDto, VerifyTokenResponseDto } from '../dto/verify-token.dto';
import { CheckIdentifierDto, CheckIdentifierResponseDto } from '../dto/check-identifier.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post('signup')
  async signup(
    @Body() signupDto: SignupDto,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    this.logger.info('POST /auth/signup', {
      context: 'AuthController',
      email: signupDto.email,
      ipAddress,
    });
    const result = await this.authService.signup(signupDto, ipAddress);
    
    // Set tokens as HTTP-only cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    
    return result;
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    this.logger.info('POST /auth/login', {
      context: 'AuthController',
      email: loginDto.email,
      ipAddress,
    });
    const result = await this.authService.login(loginDto, ipAddress);
    
    // Set tokens as HTTP-only cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    
    return result;
  }

  @Post('logout')
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    this.logger.info('POST /auth/logout', { context: 'AuthController' });
    await this.authService.logout(refreshTokenDto.refreshToken);
    
    // Clear cookies
    this.clearAuthCookies(res);
    
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    this.logger.info('POST /auth/refresh', { context: 'AuthController' });
    const result = await this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
    
    // Update access token cookie
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    
    return result;
  }

  @Post('password-reset/request')
  async requestPasswordReset(
    @Body() passwordResetRequestDto: PasswordResetRequestDto,
  ): Promise<{ message: string }> {
    this.logger.info('POST /auth/password-reset/request', {
      context: 'AuthController',
      email: passwordResetRequestDto.email,
    });
    await this.authService.requestPasswordReset(passwordResetRequestDto.email);
    return { message: 'Password reset email sent if account exists' };
  }

  @Post('password-reset/confirm')
  async confirmPasswordReset(
    @Body() passwordResetConfirmDto: PasswordResetConfirmDto,
  ): Promise<{ message: string }> {
    this.logger.info('POST /auth/password-reset/confirm', {
      context: 'AuthController',
    });
    await this.authService.confirmPasswordReset(
      passwordResetConfirmDto.token,
      passwordResetConfirmDto.newPassword,
    );
    return { message: 'Password reset successful' };
  }

  // ==========================================
  // OAuth Routes
  // ==========================================

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(): Promise<void> {
    // Initiates Google OAuth flow
    // User will be redirected to Google login
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Ip() ipAddress: string,
  ): Promise<void> {
    const oauthUser = req.user as OAuthUserDto;
    
    this.logger.info('Google OAuth callback', {
      context: 'AuthController',
      email: oauthUser.email,
      ipAddress,
    });

    const authResponse = await this.authService.handleOAuthLogin(oauthUser, ipAddress);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${authResponse.accessToken}&refresh=${authResponse.refreshToken}`;
    
    res.redirect(redirectUrl);
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth(): Promise<void> {
    // Initiates Facebook OAuth flow
    // User will be redirected to Facebook login
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Ip() ipAddress: string,
  ): Promise<void> {
    const oauthUser = req.user as OAuthUserDto;
    
    this.logger.info('Facebook OAuth callback', {
      context: 'AuthController',
      email: oauthUser.email,
      ipAddress,
    });

    const authResponse = await this.authService.handleOAuthLogin(oauthUser, ipAddress);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${authResponse.accessToken}&refresh=${authResponse.refreshToken}`;
    
    res.redirect(redirectUrl);
  }

  // ==========================================
  // Phone Login Routes
  // ==========================================

  @Post('phone/login')
  async phoneLogin(
    @Body() phoneLoginDto: PhoneLoginDto,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    this.logger.info('POST /auth/phone/login', {
      context: 'AuthController',
      phone: phoneLoginDto.phone,
      ipAddress,
    });
    const result = await this.authService.loginWithPhone(
      phoneLoginDto.phone,
      phoneLoginDto.password,
      ipAddress,
    );
    
    // Set tokens as HTTP-only cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    
    return result;
  }

  @Post('phone/otp/request')
  async requestPhoneOtp(
    @Body() phoneOtpRequestDto: PhoneOtpRequestDto,
  ): Promise<{ message: string }> {
    this.logger.info('POST /auth/phone/otp/request', {
      context: 'AuthController',
      phone: phoneOtpRequestDto.phone,
    });
    return this.authService.requestPhoneOtp(phoneOtpRequestDto.phone);
  }

  @Post('phone/otp/verify')
  async verifyPhoneOtp(
    @Body() phoneOtpVerifyDto: PhoneOtpVerifyDto,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    this.logger.info('POST /auth/phone/otp/verify', {
      context: 'AuthController',
      phone: phoneOtpVerifyDto.phone,
      ipAddress,
    });
    const result = await this.authService.verifyPhoneOtp(
      phoneOtpVerifyDto.phone,
      phoneOtpVerifyDto.code,
      ipAddress,
    );
    
    // Set tokens as HTTP-only cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    
    return result;
  }

  // ==========================================
  // Check Identifier (Email/Phone Existence)
  // ==========================================

  @Post('check-identifier')
  async checkIdentifier(
    @Body() checkIdentifierDto: CheckIdentifierDto,
  ): Promise<CheckIdentifierResponseDto> {
    this.logger.info('POST /auth/check-identifier', {
      context: 'AuthController',
      type: checkIdentifierDto.type,
    });
    
    const exists = await this.authService.checkIdentifierExists(
      checkIdentifierDto.identifier,
      checkIdentifierDto.type,
    );
    
    // Check if OTP service is available for this type
    const otpAvailable = this.authService.isOtpServiceAvailable(checkIdentifierDto.type);
    
    // Determine available auth methods
    const availableMethods: ('password' | 'otp')[] = ['password']; // Password always available
    if (otpAvailable && exists) {
      availableMethods.push('otp'); // OTP only if service is enabled AND user exists
    }
    
    return {
      exists,
      type: checkIdentifierDto.type,
      otpAvailable,
      availableMethods,
    };
  }

  // ==========================================
  // Token Verification (Gateway Internal API)
  // ==========================================

  @Post('verify')
  async verifyToken(
    @Body() verifyTokenDto: VerifyTokenDto,
    @Headers('x-gateway-secret') gatewaySecret: string,
  ): Promise<VerifyTokenResponseDto> {
    // Verify this request is from the API Gateway (internal only)
    const expectedSecret = process.env.GATEWAY_INTERNAL_SECRET || 'gateway-internal-secret-change-in-production';
    
    if (gatewaySecret !== expectedSecret) {
      this.logger.warn('Unauthorized token verification attempt', {
        context: 'AuthController',
      });
      throw new UnauthorizedException('Unauthorized');
    }

    this.logger.debug('POST /auth/verify - Gateway token verification', {
      context: 'AuthController',
    });
    
    return this.authService.verifyTokenAndGetUserInfo(verifyTokenDto.token);
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Set access token cookie (15 minutes)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax', // 'lax' allows cross-origin in development
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    // Set refresh token cookie (7 days)
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }
}
