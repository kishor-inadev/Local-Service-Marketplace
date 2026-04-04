import { IsString, IsOptional, IsBoolean, IsEmail, MinLength, MaxLength } from "class-validator";

export class ChangePasswordDto {
	@IsString()
	currentPassword: string;

	@IsString()
	@MinLength(8)
	@MaxLength(72)
	newPassword: string;
}

export class ResendVerificationEmailDto {
	@IsString()
	@IsEmail()
	email: string;
}

export class DeactivateAccountDto {
	@IsString()
	password: string;

	@IsOptional()
	@IsString()
	reason?: string;
}

export class CancelAccountDeletionDto {
	@IsString()
	password: string;
}

export class DeleteAccountDto {
	@IsString()
	password: string;

	@IsOptional()
	@IsString()
	reason?: string;
}

export class OAuthExchangeDto {
	@IsOptional()
	@IsString()
	code?: string;
}

export class SocialLinkDto {
	@IsString()
	idToken?: string; // For Google

	@IsString()
	accessToken?: string; // For Facebook
}

export class MagicLinkRequestDto {
	@IsString()
	@IsEmail()
	email: string;

	@IsOptional()
	@IsString()
	redirectUrl?: string;
}

export class AppleMobileSignInDto {
	@IsString()
	identityToken: string;

	@IsOptional()
	@IsString()
	authorizationCode?: string;

	@IsOptional()
	@IsString()
	fullName?: string; // JSON string: {"givenName":"John","familyName":"Doe"}
}
