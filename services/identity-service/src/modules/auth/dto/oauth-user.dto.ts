export interface OAuthUserDto {
  provider: 'google' | 'facebook';
  providerId: string;
  email: string;
  name?: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
}
