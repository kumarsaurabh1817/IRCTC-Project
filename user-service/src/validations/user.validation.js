import { z } from 'zod';

export const getUserInternalSchema = z.object({
     params: z.object({
          userId: z
               .string({ error: 'User Id is required' })
               .trim()
               .uuid('Invalid User Id format'),
     }),
});

export const updateProfileSchema = z.object({
     body: z
          .object({
               firstName: z
                    .string()
                    .trim()
                    .min(2, 'First name must be at least 2 characters')
                    .max(50, 'First name must not exceed 50 characters')
                    .optional(),
               lastName: z
                    .string()
                    .trim()
                    .min(2, 'Last name must be at least 2 characters')
                    .max(50, 'Last name must not exceed 50 characters')
                    .optional(),
          })
          .refine(
               (data) => data.firstName !== undefined || data.lastName !== undefined,
               {
                    message: 'At least one field (firstName or lastName) must be provided',
               }
          ),
});

export default {
     getUserInternalSchema,
     updateProfileSchema,
};
