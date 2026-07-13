ALTER TABLE `transaction_categories` ADD `user_id` text NOT NULL REFERENCES users(id) ON DELETE CASCADE;--> statement-breakpoint
CREATE INDEX `transaction_categories_user_id_idx` ON `transaction_categories` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_categories_user_name_type_unique` ON `transaction_categories` (`user_id`,`name`,`type`);