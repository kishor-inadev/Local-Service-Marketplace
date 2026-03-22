export class SocialAccount {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  access_token?: string;
  refresh_token?: string;
  created_at: Date;
}
