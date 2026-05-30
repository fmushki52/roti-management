import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id:                 text('id').primaryKey(),
  name:               text('name').notNull(),
  email:              text('email').notNull().unique(),
  passwordHash:       text('password_hash').notNull(),
  role:               text('role', { enum: ['ADMIN','MUMINEEN'] }).notNull().default('MUMINEEN'),
  mustChangePassword: integer('must_change_password', { mode: 'boolean' }).notNull().default(true),
  avatarUrl:          text('avatar_url'),
  isActive:           integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt:        text('last_login_at'),
  createdAt:          text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:          text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const rotiRequirements = sqliteTable('roti_requirements', {
  id:                     text('id').primaryKey(),
  title:                  text('title').notNull(),
  description:            text('description'),
  totalPacketsRequired:   integer('total_packets_required').notNull(),
  minPacketsPerCommit:    integer('min_packets_per_commit').default(1),
  maxPacketsPerCommit:    integer('max_packets_per_commit'),
  deliveryDate:           text('delivery_date').notNull(),
  allowMultipleCommits:   integer('allow_multiple_commits', { mode: 'boolean' }).notNull().default(false),
  status:                 text('status', { enum: ['OPEN','CLOSED','FULFILLED','CANCELLED'] }).notNull().default('OPEN'),
  createdBy:              text('created_by').notNull().references(() => users.id),
  createdAt:              text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:              text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const commitments = sqliteTable('commitments', {
  id:               text('id').primaryKey(),
  requirementId:    text('requirement_id').notNull().references(() => rotiRequirements.id),
  userId:           text('user_id').notNull().references(() => users.id),
  packetsCommitted: integer('packets_committed').notNull(),
  status:           text('status', {
                      enum: ['PENDING','APPROVED','REJECTED','PREPARING','DONE','DELIVERED','RECEIVED']
                    }).notNull().default('PENDING'),
  adminApproved:    integer('admin_approved', { mode: 'boolean' }).notNull().default(false),
  approvedAt:       text('approved_at'),
  approvedBy:       text('approved_by').references(() => users.id),
  rejectionReason:  text('rejection_reason'),
  adminFeedback:    text('admin_feedback'),
  adminRating:      integer('admin_rating'),
  createdAt:        text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:        text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const notifications = sqliteTable('notifications', {
  id:          text('id').primaryKey(),
  title:       text('title').notNull(),
  message:     text('message').notNull(),
  type:        text('type', { enum: ['INFO','SUCCESS','WARNING','ALERT'] }).notNull().default('INFO'),
  senderId:    text('sender_id').notNull().references(() => users.id),
  recipientId: text('recipient_id').references(() => users.id),
  isRead:      integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt:   text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const refreshTokens = sqliteTable('refresh_tokens', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
