import { z } from 'zod';

export const CreateRequirementSchema = z.object({
  title:                  z.string().min(3).max(120),
  description:            z.string().max(500).optional(),
  totalPacketsRequired:   z.number().int().min(1).max(10000),
  deliveryDate:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  allowMultipleCommits:   z.boolean().default(false),
});

export const UpdateRequirementSchema = CreateRequirementSchema.partial().extend({
  status: z.enum(['OPEN','CLOSED','FULFILLED']).optional(),
});
