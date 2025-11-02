import { z } from 'zod';

// Get profile - no validation needed (just auth)

// Update profile schema
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z
      .string()
      .regex(/^[0-9]{10,11}$/, 'Phone must be 10-11 digits')
      .optional()
      .or(z.literal('')), // Allow empty string to clear
    address: z
      .string()
      .min(10, 'Address must be at least 10 characters')
      .optional()
      .or(z.literal('')), // Allow empty string to clear
  }),
});

// Change password schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[@$!%*?&]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>['body'];
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>['body'];
