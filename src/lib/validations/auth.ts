import { z } from 'zod';

export const LoginSchema = z.object({
  itsNumber: z.string().regex(/^\d{8}$/, 'ITS Number must be exactly 8 digits'),
  password:  z.string().min(1, 'Password is required'),
});

export const ChangePasswordSchema = z.object({
  newPassword:     z.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
