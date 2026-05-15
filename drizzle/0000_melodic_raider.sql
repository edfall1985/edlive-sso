CREATE TABLE `accounts` (
	`user_id` int NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`provider_account_id` varchar(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	CONSTRAINT `accounts_provider_provider_account_id_pk` PRIMARY KEY(`provider`,`provider_account_id`)
);
--> statement-breakpoint
CREATE TABLE `ai_summaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debate_id` int NOT NULL,
	`summary_type` enum('summary','fallacy','insight','knowledge') NOT NULL,
	`content` json,
	`ai_provider` varchar(50) DEFAULT 'gemini',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `ai_summaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challenge_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challenge_id` int NOT NULL,
	`user_id` int,
	`response` text,
	`session_id` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `challenge_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debate_id` int NOT NULL,
	`user_id` int,
	`display_name` varchar(100),
	`content` text NOT NULL,
	`likes_count` int DEFAULT 0,
	`is_highlighted` boolean DEFAULT false,
	`is_moderated` boolean DEFAULT false,
	`session_id` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debate_phases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debate_id` int NOT NULL,
	`phase_name` varchar(50) NOT NULL,
	`duration_seconds` int DEFAULT 300,
	`started_at` datetime,
	`ended_at` datetime,
	CONSTRAINT `debate_phases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`motion` text,
	`description` text,
	`status` enum('scheduled','live','paused','ended') DEFAULT 'scheduled',
	`session_type` enum('viewer','education','enjoy') DEFAULT 'education',
	`current_phase` varchar(50) DEFAULT 'opening',
	`tiktok_live_url` varchar(500),
	`started_at` datetime,
	`ended_at` datetime,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `debates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debate_id` int NOT NULL,
	`user_id` int,
	`title` varchar(255),
	`media_type` enum('image','video','pdf','article','link','chart') NOT NULL,
	`url` varchar(500) NOT NULL,
	`description` text,
	`is_approved` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_token` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_session_token_unique` UNIQUE(`session_token`)
);
--> statement-breakpoint
CREATE TABLE `speakers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debate_id` int NOT NULL,
	`user_id` int,
	`display_name` varchar(150) NOT NULL,
	`title` varchar(200),
	`avatar_url` varchar(500),
	`position` enum('pro','kontra') NOT NULL,
	`speaking_order` int DEFAULT 0,
	`total_speaking_time` int DEFAULT 0,
	`is_speaking` boolean DEFAULT false,
	`is_active` boolean DEFAULT true,
	CONSTRAINT `speakers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `typing_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debate_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`prompt` text NOT NULL,
	`team_target` enum('pro','kontra','all') DEFAULT 'all',
	`response_emoji` varchar(50),
	`started_at` datetime,
	`ended_at` datetime,
	`is_active` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `typing_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`username` varchar(100),
	`password_hash` varchar(255),
	`display_name` varchar(150),
	`avatar_url` varchar(500),
	`google_id` varchar(255),
	`auth_provider` enum('google','credentials') DEFAULT 'google',
	`role` enum('owner','admin','moderator','mc','user') DEFAULT 'user',
	`bio` text,
	`is_active` boolean DEFAULT true,
	`email_verified` datetime,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_google_id_unique` UNIQUE(`google_id`)
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `verification_tokens_identifier_token_pk` PRIMARY KEY(`identifier`,`token`)
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debate_id` int NOT NULL,
	`user_id` int,
	`vote_type` enum('pro','kontra') NOT NULL,
	`category` enum('most_logical','most_convincing','most_data_based','most_emotional'),
	`speaker_id` int,
	`session_id` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `votes_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_vote` UNIQUE(`debate_id`,`user_id`,`category`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_summaries` ADD CONSTRAINT `ai_summaries_debate_id_debates_id_fk` FOREIGN KEY (`debate_id`) REFERENCES `debates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `challenge_responses` ADD CONSTRAINT `challenge_responses_challenge_id_typing_challenges_id_fk` FOREIGN KEY (`challenge_id`) REFERENCES `typing_challenges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `challenge_responses` ADD CONSTRAINT `challenge_responses_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_debate_id_debates_id_fk` FOREIGN KEY (`debate_id`) REFERENCES `debates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `debate_phases` ADD CONSTRAINT `debate_phases_debate_id_debates_id_fk` FOREIGN KEY (`debate_id`) REFERENCES `debates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `debates` ADD CONSTRAINT `debates_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media` ADD CONSTRAINT `media_debate_id_debates_id_fk` FOREIGN KEY (`debate_id`) REFERENCES `debates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media` ADD CONSTRAINT `media_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `speakers` ADD CONSTRAINT `speakers_debate_id_debates_id_fk` FOREIGN KEY (`debate_id`) REFERENCES `debates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `speakers` ADD CONSTRAINT `speakers_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `typing_challenges` ADD CONSTRAINT `typing_challenges_debate_id_debates_id_fk` FOREIGN KEY (`debate_id`) REFERENCES `debates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_debate_id_debates_id_fk` FOREIGN KEY (`debate_id`) REFERENCES `debates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_speaker_id_speakers_id_fk` FOREIGN KEY (`speaker_id`) REFERENCES `speakers`(`id`) ON DELETE no action ON UPDATE no action;