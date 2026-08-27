ALTER TABLE `plans` ADD `oldPriceCents` int NOT NULL;--> statement-breakpoint
ALTER TABLE `plans` ADD `economyCents` int NOT NULL;--> statement-breakpoint
ALTER TABLE `plans` ADD `note` varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE `plans` ADD `details` json NOT NULL;--> statement-breakpoint
ALTER TABLE `plans` ADD `featured` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `plans` ADD `tone` enum('purple','yellow') DEFAULT 'purple' NOT NULL;