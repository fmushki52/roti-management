import { z } from 'zod';

export const CreateNotificationSchema = z.object({
  title:       z.string().min(2).max(100),
  message:     z.string().min(5).max(1000),
  type:        z.enum(['INFO','SUCCESS','WARNING','ALERT']),
  recipientId: z.string().uuid().optional(),
});
