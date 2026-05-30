import { pgTable, text, integer, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id:                 text('id').primaryKey(),
  itsNumber:          text('its_number').notNull().unique(),   // 8-digit ITS number — primary login ID
  name:               text('name').notNull(),
  email:              text('email'),                           // optional contact email
  passwordHash:       text('password_hash').notNull(),
  role:               text('role').notNull().default('MUMINEEN').$type<'ADMIN' | 'MUMINEEN'>(),
  mustChangePassword: boolean('must_change_password').notNull().default(true),
  avatarUrl:          text('avatar_url'),
  isActive:           boolean('is_active').notNull().default(true),
  lastLoginAt:        text('last_login_at'),
  createdAt:          text('created_at').notNull().default(sql`to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`),
  updatedAt:          text('updated_at').notNull().default(sql`to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`),
});

export const rotiRequirements = pgTable('roti_requirements', {
  id:                     text('id').primaryKey(),
  title:                  text('title').notNull(),
  description:            text('description'),
  totalPacketsRequired:   integer('total_packets_required').notNull(),
  minPacketsPerCommit:    integer('min_packets_per_commit').default(1),
  maxPacketsPerCommit:    integer('max_packets_per_commit'),
  deliveryDate:           text('delivery_date').notNull(),
  allowMultipleCommits:   boolean('allow_multiple_commits').notNull().default(false),
  status:                 text('status').notNull().default('OPEN').$type<'OPEN' | 'CLOSED' | 'FULFILLED' | 'CANCELLED'>(),
  createdBy:              text('created_by').notNull().references(() => users.id),
  createdAt:              text('created_at').notNull().default(sql`to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`),
  updatedAt:              text('updated_at').notNull().default(sql`to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`),
});

export const commitments = pgTable('commitments', {
  id:               text('id').primaryKey(),
  requirementId:    text('requirement_id').notNull().references(() => rotiRequirements.id),
  userId:           text('user_id').notNull().references(() => users.id),
  packetsCommitted: integer('packets_committed').notNull(),
  status:           text('status').notNull().default('PENDING').$type<'PENDING' | 'APPROVED' | 'REJECTED' | 'PREPARING' | 'DONE' | 'DELIVERED' | 'RECEIVED'>(),
  adminApproved:    boolean('admin_approved').notNull().default(false),
  approvedAt:       text('approved_at'),
  approvedBy:       text('approved_by').references(() => users.id),
  rejectionReason:  text('rejection_reason'),
  adminFeedback:    text('admin_feedback'),
  adminRating:      integer('admin_rating'),
  createdAt:        text('created_at').notNull().default(sql`to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`),
  updatedAt:        text('updated_at').notNull().default(sql`to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`),
});

export const notifications = pgTable('notifications', {
  id:          text('id').primaryKey(),
  title:       text('title').notNull(),
  message:     text('message').notNull(),
  type:        text('type').notNull().default('INFO').$type<'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT'>(),
  senderId:    text('sender_id').notNull().references(() => users.id),
  recipientId: text('recipient_id').references(() => users.id),
  isRead:      boolean('is_read').notNull().default(false),
  createdAt:   text('created_at').notNull().default(sql`to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`),
});
