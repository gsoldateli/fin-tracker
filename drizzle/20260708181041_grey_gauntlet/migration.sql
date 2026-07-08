CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`email` text(255) NOT NULL UNIQUE,
	`created_at` integer NOT NULL
);
