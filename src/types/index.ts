export type Role = 'ADMIN' | 'MUMINEEN' | 'DELIVERY_TEAM';
export type RequirementStatus = 'OPEN' | 'CLOSED' | 'FULFILLED' | 'CANCELLED';
export type CommitmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PREPARING' | 'DONE' | 'DELIVERED' | 'RECEIVED';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';

export interface User {
  id: string;
  itsNumber: string;
  name: string;
  email?: string | null;
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
  minPacketsPerCommit?: number | null;
  maxPacketsPerCommit?: number | null;
  amountPerPacket?: string | null;   // KD decimal, admin-only
  deliveryDate: string;
  allowMultipleCommits: boolean;
  status: RequirementStatus;
  closingRating?: number | null;
  closingNotes?: string | null;
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
  actualDeliveredQty?: number | null;
  status: CommitmentStatus;
  adminApproved: boolean;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectionReason?: string | null;
  paymentExempt: boolean;
  paymentOverrideAmount?: string | null;
  deliveryConfirmedBy?: string | null;
  deliveryConfirmedAt?: string | null;
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

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  details?: string | null;
  createdAt: string;
  performerName?: string;
}

export interface Payment {
  id: string;
  commitmentId: string;
  userId: string;
  requirementId: string;
  amountOwed?: string | null;
  amountPaid: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  paidBy: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  // joined fields
  userName?: string;
  userItsNumber?: string;
  requirementTitle?: string;
  paidByName?: string;
  committedQty?: number;
  deliveredQty?: number | null;
}
