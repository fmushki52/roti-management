import { z } from 'zod';

export const CreateUserSchema = z.object({
  itsNumber: z.string().regex(/^\d{8}$/, 'ITS Number must be exactly 8 digits'),
  name:      z.string().min(2).max(80),
  email:     z.string().email().optional().or(z.literal('')),
  role:      z.enum(['ADMIN', 'MUMINEEN', 'DELIVERY_TEAM']).default('MUMINEEN'),
});

export const UpdateUserSchema = z.object({
  name:  z.string().min(2).max(80).optional(),
  email: z.string().email().optional().or(z.literal('')),
});
