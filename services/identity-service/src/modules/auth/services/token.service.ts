import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EmailVerificationTokenRepository } from '../repositories/email-verification-token.repository';
import { PasswordResetTokenRepository } from '../repositories/password-reset-token.repository';

@Injectable()
export class TokenService {
	constructor(
		private readonly emailVerificationTokenRepo: EmailVerificationTokenRepository,
		private readonly passwordResetTokenRepo: PasswordResetTokenRepository,
		private readonly configService: ConfigService,
	) {}

	generateRandomToken(): string {
		return crypto.randomBytes(32).toString("hex");
	}

	async createEmailVerificationToken(userId: string): Promise<string> {
		const token = this.generateRandomToken();
		const expiresInHours = parseInt(
			this.configService.get<string>("EMAIL_VERIFICATION_EXPIRES_IN", "24").replace("h", ""),
			10,
		);
		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + expiresInHours);

		// Delete any existing tokens for this user
		await this.emailVerificationTokenRepo.deleteByUserId(userId);

		await this.emailVerificationTokenRepo.create(userId, token, expiresAt);
		return token;
	}

	async verifyEmailToken(token: string): Promise<string | null> {
		const tokenRecord = await this.emailVerificationTokenRepo.findByToken(token);

		if (!tokenRecord) {
			return null;
		}

		if (new Date() > new Date(tokenRecord.expires_at)) {
			await this.emailVerificationTokenRepo.deleteByToken(token);
			return null;
		}

		await this.emailVerificationTokenRepo.deleteByToken(token);
		return tokenRecord.user_id;
	}

	async createPasswordResetToken(userId: string): Promise<string> {
		const token = this.generateRandomToken();
		const expiresInHours = parseInt(
			this.configService.get<string>("PASSWORD_RESET_EXPIRES_IN", "1").replace("h", ""),
			10,
		);
		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + expiresInHours);

		// Delete any existing tokens for this user
		await this.passwordResetTokenRepo.deleteByUserId(userId);

		await this.passwordResetTokenRepo.create(userId, token, expiresAt);
		return token;
	}

	async createEmailOtpToken(userId: string): Promise<string> {
		// Generate cryptographically secure 6-digit OTP
		const otp = String(crypto.randomInt(100000, 1000000));
		const expiresAt = new Date();
		expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10-minute TTL

		// Delete any existing OTP tokens for this user before creating a new one
		await this.emailVerificationTokenRepo.deleteByUserId(userId);

		await this.emailVerificationTokenRepo.create(userId, otp, expiresAt);
		return otp;
	}

	async verifyEmailOtpToken(userId: string, code: string): Promise<boolean> {
		return this.emailVerificationTokenRepo.consumeByUserIdAndToken(userId, code);
	}

	async verifyPasswordResetToken(token: string): Promise<string | null> {
		const tokenRecord = await this.passwordResetTokenRepo.findByToken(token);

		if (!tokenRecord) {
			return null;
		}

		if (new Date() > new Date(tokenRecord.expires_at)) {
			await this.passwordResetTokenRepo.deleteByToken(token);
			return null;
		}

		await this.passwordResetTokenRepo.deleteByToken(token);
		return tokenRecord.user_id;
	}
}
