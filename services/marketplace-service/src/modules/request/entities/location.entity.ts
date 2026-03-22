export class Location {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  created_at: Date;
}
