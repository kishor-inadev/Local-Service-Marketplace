import { z } from 'zod';

/**
 * Create proposal validation schema
 */
export const createProposalSchema = z.object({
  request_id: z
    .string()
    .uuid('Invalid request ID')
    .min(1, 'Request ID is required'),
  provider_id: z
    .string()
    .uuid('Invalid provider ID')
    .min(1, 'Provider ID is required'),
  price: z
    .number()
    .positive('Price must be greater than 0')
    .max(1000000, 'Price must not exceed 1,000,000'),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(1000, 'Message must not exceed 1000 characters'),
  estimated_hours: z
    .number()
    .positive('Estimated hours must be positive')
    .max(1000, 'Estimated hours must not exceed 1000')
    .optional(),
  start_date: z
    .string()
    .optional(),
  completion_date: z
    .string()
    .optional(),
});

export type CreateProposalFormData = z.infer<typeof createProposalSchema>;

/**
 * Update proposal validation schema
 */
export const updateProposalSchema = z.object({
  price: z
    .number()
    .positive('Price must be greater than 0')
    .max(1000000, 'Price must not exceed 1,000,000')
    .optional(),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(1000, 'Message must not exceed 1000 characters')
    .optional(),
  estimated_hours: z
    .number()
    .positive('Estimated hours must be positive')
    .max(1000, 'Estimated hours must not exceed 1000')
    .optional(),
  start_date: z
    .string()
    .optional(),
  completion_date: z
    .string()
    .optional(),
});

export type UpdateProposalFormData = z.infer<typeof updateProposalSchema>;
