import { Location } from "./location.entity";

export class ServiceRequest {
  id: string;
  display_id: string;
  user_id?: string | null; // Optional for anonymous requests
  category_id: string;
  location_id?: string;
  location?: Location;
  description: string;
  budget: number;
  images?: string[];
  preferred_date?: Date;
  urgency: string;
  expiry_date?: Date;
  view_count: number;
  status: string;
  // Guest information for anonymous requests
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
}
