CREATE TABLE `commitments` (
	`id` text PRIMARY KEY NOT NULL,
	`requirement_id` text NOT NULL,
	`user_id` text NOT NULL,
	`packets_committed` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`admin_approved` integer DEFAULT false NOT NULL,
	`approved_at` text,
	`approved_by` text,
	`rejection_reason` text,
	`admin_feedback` text,
	`admin_rating` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`requirement_id`) REFERENCES `roti_requirements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text DEFAULT 'INFO' NOT NULL,
	`sender_id` text NOT NULL,
	`recipient_id` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `roti_requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`total_packets_required` integer NOT NULL,
	`delivery_date` text NOT NULL,
	`allow_multiple_commits` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'MUMINEEN' NOT NULL,
	`must_change_password` integer DEFAULT true NOT NULL,
	`avatar_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);