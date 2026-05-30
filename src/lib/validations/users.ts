import { z } from 'zod';

export const CreateUserSchema = z.object({
  name:  z.string().min(2).max(80),
  email: z.string().email(),
  role:  z.enum(['ADMIN', 'MUMINEEN']).default('MUMINEEN'),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
});
