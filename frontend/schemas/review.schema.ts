import { z } from 'zod';

/**
 * Create review validation schema
 */
export const createReviewSchema = z.object({
  job_id: z
    .string()
    .uuid('Invalid job ID')
    .min(1, 'Job ID is required'),
  rating: z
    .coerce.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5'),
  comment: z
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(500, 'Comment must not exceed 500 characters'),
});

export type CreateReviewFormData = z.infer<typeof createReviewSchema>;
