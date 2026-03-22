export class Review {
  id: string;
  job_id: string;
  user_id: string;
  provider_id: string;
  rating: number;
  comment: string;
  response?: string;                     // ✅ NEW
  response_at?: Date;                    // ✅ NEW
  helpful_count: number;                 // ✅ NEW
  verified_purchase: boolean;            // ✅ NEW
  created_at: Date;
}


