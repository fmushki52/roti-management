import { z } from 'zod';

export const CreateRequirementSchema = z.object({
  title:                  z.string().min(3).max(120),
  description:            z.string().max(500).optional(),
  totalPacketsRequired:   z.number().int().min(1).max(10000),
  minPacketsPerCommit:    z.number().int().min(1).default(1),
  maxPacketsPerCommit:    z.number().int().min(1).optional(),
  deliveryDate:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  allowMultipleCommits:   z.boolean().default(false),
}).refine(d => !d.maxPacketsPerCommit || d.maxPacketsPerCommit >= d.minPacketsPerCommit, {
  message: 'Max must be ≥ min',
  path: ['maxPacketsPerCommit'],
});

export const UpdateRequirementSchema = z.object({
  title:                  z.string().min(3).max(120).optional(),
  description:            z.string().max(500).optional(),
  totalPacketsRequired:   z.number().int().min(1).max(10000).optional(),
  minPacketsPerCommit:    z.number().int().min(1).optional(),
  maxPacketsPerCommit:    z.number().int().min(1).optional(),
  deliveryDate:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  allowMultipleCommits:   z.boolean().optional(),
  status:                 z.enum(['OPEN','CLOSED','FULFILLED','CANCELLED']).optional(),
});
