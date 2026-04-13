import { z } from 'zod';

/**
 * Location validation schema
 */
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  state_code: z.string().max(2).optional(),
  district: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional().or(z.literal('')),
  country: z.string().optional(),
});

/**
 * Create service request validation schema
 */
export const createRequestSchema = z.object({
  category_id: z
    .string()
    .uuid('Invalid category ID')
    .min(1, 'Please select a category'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  budget: z
    .coerce.number()
    .positive('Budget must be greater than 0')
    .max(10000000, 'Budget cannot exceed \u20b910,00,000'),
  location: locationSchema.optional(),
});

export type CreateRequestFormData = z.infer<typeof createRequestSchema>;

/**
 * Update service request validation schema
 */
export const updateRequestSchema = z.object({
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  budget: z
    .number()
    .positive('Budget must be greater than 0')
    .max(1000000, 'Budget must not exceed 1,000,000')
    .optional(),
  status: z
    .enum(['open', 'assigned', 'completed', 'cancelled'])
    .optional(),
});

export type UpdateRequestFormData = z.infer<typeof updateRequestSchema>;

/**
 * Request filters validation schema
 */
export const requestFiltersSchema = z.object({
  status: z.enum(['open', 'assigned', 'completed', 'cancelled']).optional(),
  category_id: z.string().uuid().optional(),
  min_budget: z.number().positive().optional(),
  max_budget: z.number().positive().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
}).refine(
  (data) => {
    if (data.min_budget && data.max_budget) {
      return data.min_budget <= data.max_budget;
    }
    return true;
  },
  {
    message: 'Minimum budget must be less than or equal to maximum budget',
    path: ['max_budget'],
  }
);

export type RequestFiltersData = z.infer<typeof requestFiltersSchema>;
