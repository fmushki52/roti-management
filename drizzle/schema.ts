import { pgTable, text, integer, boolean, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const NOW = sql`to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

// ── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:                 text('id').primaryKey(),
  itsNumber:          text('its_number').notNull().unique(),
  name:               text('name').notNull(),
  email:              text('email'),
  passwordHash:       text('password_hash').notNull(),
  role:               text('role').notNull().default('MUMINEEN')
                        .$type<'ADMIN' | 'MUMINEEN' | 'DELIVERY_TEAM'>(),
  mustChangePassword: boolean('must_change_password').notNull().default(true),
  avatarUrl:          text('avatar_url'),
  isActive:           boolean('is_active').notNull().default(true),
  lastLoginAt:        text('last_login_at'),
  createdAt:          text('created_at').notNull().default(NOW),
  updatedAt:          text('updated_at').notNull().default(NOW),
});

// ── ROTI Requirements ────────────────────────────────────────────────────────
export const rotiRequirements = pgTable('roti_requirements', {
  id:                   text('id').primaryKey(),
  title:                text('title').notNull(),
  description:          text('description'),
  totalPacketsRequired: integer('total_packets_required').notNull(),
  minPacketsPerCommit:  integer('min_packets_per_commit').default(1),
  maxPacketsPerCommit:  integer('max_packets_per_commit'),
  amountPerPacket:      numeric('amount_per_packet', { precision: 10, scale: 3 }), // KD with fils, admin-only
  deliveryDate:         text('delivery_date').notNull(),
  allowMultipleCommits: boolean('allow_multiple_commits').notNull().default(false),
  status:               text('status').notNull().default('OPEN')
                          .$type<'OPEN' | 'CLOSED' | 'FULFILLED' | 'CANCELLED'>(),
  closingRating:        integer('closing_rating'),          // 1-5 admin rating on close
  closingNotes:         text('closing_notes'),
  createdBy:            text('created_by').notNull().references(() => users.id),
  createdAt:            text('created_at').notNull().default(NOW),
  updatedAt:            text('updated_at').notNull().default(NOW),
});

// ── Mumineen Commitments ─────────────────────────────────────────────────────
export const commitments = pgTable('commitments', {
  id:                    text('id').primaryKey(),
  requirementId:         text('requirement_id').notNull().references(() => rotiRequirements.id),
  userId:                text('user_id').notNull().references(() => users.id),
  packetsCommitted:      integer('packets_committed').notNull(),
  actualDeliveredQty:    integer('actual_delivered_qty'),       // set by delivery team on receipt
  status:                text('status').notNull().default('PENDING')
                           .$type<'PENDING'|'APPROVED'|'REJECTED'|'PREPARING'|'DONE'|'DELIVERED'|'RECEIVED'>(),
  adminApproved:         boolean('admin_approved').notNull().default(false),
  approvedAt:            text('approved_at'),
  approvedBy:            text('approved_by').references(() => users.id),
  rejectionReason:       text('rejection_reason'),
  paymentExempt:         boolean('payment_exempt').notNull().default(false), // no payment required
  paymentOverrideAmount: numeric('payment_override_amount', { precision: 10, scale: 3 }), // manual override
  deliveryConfirmedBy:   text('delivery_confirmed_by').references(() => users.id),
  deliveryConfirmedAt:   text('delivery_confirmed_at'),
  adminFeedback:         text('admin_feedback'),
  adminRating:           integer('admin_rating'),
  createdAt:             text('created_at').notNull().default(NOW),
  updatedAt:             text('updated_at').notNull().default(NOW),
});

// ── Notifications ────────────────────────────────────────────────────────────
export const notifications = pgTable('notifications', {
  id:          text('id').primaryKey(),
  title:       text('title').notNull(),
  message:     text('message').notNull(),
  type:        text('type').notNull().default('INFO')
                 .$type<'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT'>(),
  senderId:    text('sender_id').notNull().references(() => users.id),
  recipientId: text('recipient_id').references(() => users.id),
  isRead:      boolean('is_read').notNull().default(false),
  createdAt:   text('created_at').notNull().default(NOW),
});

// ── Audit Logs ───────────────────────────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  id:          text('id').primaryKey(),
  action:      text('action').notNull(), // e.g. 'APPROVAL_REVERSED', 'APPROVED', 'DELIVERY_CONFIRMED'
  entityType:  text('entity_type').notNull(), // 'commitment' | 'requirement' | 'payment'
  entityId:    text('entity_id').notNull(),
  performedBy: text('performed_by').notNull().references(() => users.id),
  details:     text('details'), // JSON string with extra context
  createdAt:   text('created_at').notNull().default(NOW),
});

// ── Payments ─────────────────────────────────────────────────────────────────
export const payments = pgTable('payments', {
  id:            text('id').primaryKey(),
  commitmentId:  text('commitment_id').notNull().references(() => commitments.id),
  userId:        text('user_id').notNull().references(() => users.id),
  requirementId: text('requirement_id').notNull().references(() => rotiRequirements.id),
  amountOwed:    numeric('amount_owed', { precision: 10, scale: 3 }),   // calculated or overridden
  amountPaid:    numeric('amount_paid', { precision: 10, scale: 3 }).notNull(),
  paymentMethod: text('payment_method').notNull()
                   .$type<'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER'>(),
  paymentDate:   text('payment_date').notNull(),
  paidBy:        text('paid_by').notNull().references(() => users.id),
  notes:         text('notes'),
  createdAt:     text('created_at').notNull().default(NOW),
  updatedAt:     text('updated_at').notNull().default(NOW),
});

// ── Refresh Tokens ───────────────────────────────────────────────────────────
export const refreshTokens = pgTable('refresh_tokens', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(NOW),
});
