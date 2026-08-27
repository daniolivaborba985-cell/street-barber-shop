ALTER TABLE `subscriptions` ADD `barberId` int;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_barberId_barbers_id_fk` FOREIGN KEY (`barberId`) REFERENCES `barbers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `subscriptions_barber_idx` ON `subscriptions` (`barberId`);