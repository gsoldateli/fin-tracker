PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`type` text NOT NULL,
	`category_id` text,
	`amount_cents` integer NOT NULL,
	`transfer_group_id` text,
	`counterparty_account_id` text,
	`description` text(255),
	`date` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_transactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_transactions_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_transactions_category_id_transaction_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `transaction_categories`(`id`),
	CONSTRAINT `fk_transactions_counterparty_account_id_accounts_id_fk` FOREIGN KEY (`counterparty_account_id`) REFERENCES `accounts`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_transactions`(`id`, `user_id`, `account_id`, `type`, `category_id`, `amount_cents`, `transfer_group_id`, `counterparty_account_id`, `description`, `date`, `created_at`) SELECT `id`, `user_id`, `account_id`, `type`, `category_id`, `amount_cents`, `transfer_group_id`, `counterparty_account_id`, `description`, `date`, `created_at` FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `transactions_account_id_idx` ON `transactions` (`account_id`);--> statement-breakpoint
CREATE INDEX `transactions_user_date_idx` ON `transactions` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `transactions_transfer_group_idx` ON `transactions` (`transfer_group_id`);