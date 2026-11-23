import { z } from 'zod';

const passwordRegex =
     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+={}[\]|\\:;"'<>,.~`/])[A-Za-z\d@$!%*?&#^()_\-+={}[\]|\\:;"'<>,.~`/]{8,64}$/;

export const sendOTPSchema = z.object({
     body: z
          .object({
               firstName: z
                    .string({ error: 'First name is required' })
                    .trim()
                    .min(2, 'First name must be at least 2 characters')
                    .max(50, 'First name must not exceed 50 characters'),
               lastName: z
                    .string({ error: 'Last name is required' })
                    .trim()
                    .min(2, 'Last name must be at least 2 characters')
                    .max(50, 'Last name must not exceed 50 characters'),
               email: z
                    .string({ error: 'Email is required' })
                    .trim()
                    .toLowerCase()
                    .email('Invalid email address'),
               password: z
                    .string({ error: 'Password is required' })
                    .min(8, 'Password must be at least 8 characters')
                    .max(64, 'Password must not exceed 64 characters')
                    .regex(
                         passwordRegex,
                         'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
                    ),
               confirmPassword: z
                    .string({ error: 'Confirm password is required' })
                    .min(1, 'Confirm password is required'),
          })
          .refine((data) => data.password === data.confirmPassword, {
               message: 'Password mismatch',
               path: ['confirmPassword'],
          }),
});

export const verifyOTPSchema = z.object({
     body: z.object({
          otp: z
               .string({ error: 'OTP is required' })
               .trim()
               .regex(/^\d{6}$/, 'OTP must be a 6-digit number'),
     }),
     cookies: z
          .object({
               otp_session: z
                    .string({ error: 'OTP session is missing' })
                    .uuid('Invalid OTP session'),
          })
          .passthrough(),
});

export const loginSchema = z.object({
     body: z.object({
          email: z
               .string({ error: 'Email is required' })
               .trim()
               .toLowerCase()
               .email('Invalid email address'),
          password: z
               .string({ error: 'Password is required' })
               .min(1, 'Password is required'),
     }),
});

export const refreshTokenSchema = z.object({
     cookies: z
          .object({
               refreshToken: z
                    .string({ error: 'Refresh token is missing' })
                    .min(1, 'Refresh token is missing'),
          })
          .passthrough(),
});

export const googleAuthSchema = z.object({
     body: z.object({
          idToken: z
               .string({ error: 'Google ID token is required' })
               .trim()
               .min(1, 'Invalid Google ID Token'),
     }),
});

export default {
     sendOTPSchema,
     verifyOTPSchema,
     loginSchema,
     refreshTokenSchema,
     googleAuthSchema,
};
