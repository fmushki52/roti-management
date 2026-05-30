export type Role = 'ADMIN' | 'MUMINEEN';
export type RequirementStatus = 'OPEN' | 'CLOSED' | 'FULFILLED';
export type CommitmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PREPARING' | 'DONE' | 'DELIVERED' | 'RECEIVED';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RotiRequirement {
  id: string;
  title: string;
  description?: string | null;
  totalPacketsRequired: number;
  deliveryDate: string;
  allowMultipleCommits: boolean;
  status: RequirementStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  totalCommitted?: number;
}

export interface Commitment {
  id: string;
  requirementId: string;
  userId: string;
  packetsCommitted: number;
  status: CommitmentStatus;
  adminApproved: boolean;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectionReason?: string | null;
  adminFeedback?: string | null;
  adminRating?: number | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  requirement?: RotiRequirement;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  senderId: string;
  recipientId?: string | null;
  isRead: boolean;
  createdAt: string;
  sender?: User;
}
