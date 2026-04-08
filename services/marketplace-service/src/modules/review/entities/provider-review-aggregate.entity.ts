export class ProviderReviewAggregate {
  provider_id: string;
  total_reviews: number;
  average_rating: number;
  rating_1_count: number;
  rating_2_count: number;
  rating_3_count: number;
  rating_4_count: number;
  rating_5_count: number;
  last_review_at?: Date;
  updated_at?: Date;
}
