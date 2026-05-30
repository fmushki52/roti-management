import { z } from 'zod';

export const CreateCommitmentSchema = z.object({
  requirementId:    z.string().uuid(),
  packetsCommitted: z.number().int().min(1),
});

export const FeedbackSchema = z.object({
  rating:   z.number().int().min(1).max(5),
  feedback: z.string().max(500).optional(),
});

export const RejectCommitmentSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const UpdateCommitmentStatusSchema = z.object({
  status: z.enum(['PREPARING', 'DONE']),
});
