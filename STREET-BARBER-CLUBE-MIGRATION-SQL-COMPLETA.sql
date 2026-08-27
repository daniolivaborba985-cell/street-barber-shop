-- Street Barber Clube — SQL gerado pelo Drizzle para revisão — NÃO APLICAR
CREATE TABLE `benefitUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubMemberId` int NOT NULL,
	`membershipCycleId` int NOT NULL,
	`appointmentId` int,
	`serviceId` int,
	`barberId` int,
	`kind` enum('cut','beard','eyebrow','discount','benefit') NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`usedAt` timestamp NOT NULL DEFAULT (now()),
	`idempotencyKey` varchar(191) NOT NULL,
	`note` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `benefitUsage_id` PRIMARY KEY(`id`),
	CONSTRAINT `benefitUsage_idempotency_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `clubMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`status` enum('pending','active','cancelled','expired','suspended') NOT NULL DEFAULT 'pending',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clubMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `clubMembers_customer_unique` UNIQUE(`customerId`)
);
--> statement-breakpoint
CREATE TABLE `customerSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `customerSessions_token_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `membershipCycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`clubMemberId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('pending','active','closed','expired') NOT NULL DEFAULT 'pending',
	`startedAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`nextRenewalAt` timestamp,
	`entitlementsSnapshot` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `membershipCycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerBenefits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`benefitId` int,
	`title` varchar(255) NOT NULL,
	`description` varchar(500),
	`discountPercent` int,
	`validFrom` date,
	`validUntil` date,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partnerBenefits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`customerId` int NOT NULL,
	`method` enum('card','pix') NOT NULL,
	`status` enum('pending','approved','declined','cancelled','refunded','expired') NOT NULL DEFAULT 'pending',
	`amountCents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`provider` varchar(64),
	`externalPaymentRef` varchar(191),
	`idempotencyKey` varchar(191) NOT NULL,
	`dueAt` timestamp,
	`paidAt` timestamp,
	`failureReason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_idempotency_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `planEntitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`kind` enum('cuts','beards','service','eyebrow','discount','benefit') NOT NULL,
	`serviceId` int,
	`quantity` int NOT NULL DEFAULT 0,
	`discountPercent` int,
	`description` varchar(500),
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planEntitlements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `raffleParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`raffleId` int NOT NULL,
	`customerId` int NOT NULL,
	`status` enum('eligible','removed','winner') NOT NULL DEFAULT 'eligible',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `raffleParticipants_id` PRIMARY KEY(`id`),
	CONSTRAINT `raffleParticipants_raffle_customer_unique` UNIQUE(`raffleId`,`customerId`)
);
--> statement-breakpoint
CREATE TABLE `raffles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`campaign` varchar(255) NOT NULL,
	`prize` varchar(500) NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`drawAt` timestamp NOT NULL,
	`status` enum('draft','open','closed','drawn','cancelled') NOT NULL DEFAULT 'draft',
	`winnerCustomerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `raffles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rouletteRewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(500),
	`rewardType` enum('percent_discount','fixed_discount','free_service','benefit') NOT NULL,
	`discountPercent` int,
	`discountCents` int,
	`serviceId` int,
	`benefitId` int,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rouletteRewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rouletteSpins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubMemberId` int NOT NULL,
	`membershipCycleId` int NOT NULL,
	`rewardId` int NOT NULL,
	`status` enum('consumed','reversed') NOT NULL DEFAULT 'consumed',
	`spunAt` timestamp NOT NULL DEFAULT (now()),
	`idempotencyKey` varchar(191) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rouletteSpins_id` PRIMARY KEY(`id`),
	CONSTRAINT `rouletteSpins_member_cycle_unique` UNIQUE(`clubMemberId`,`membershipCycleId`),
	CONSTRAINT `rouletteSpins_idempotency_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`customerId` int NOT NULL,
	`event` enum('created','payment_pending','payment_approved','payment_declined','renewed','cancelled','expired','refunded') NOT NULL,
	`fromStatus` varchar(32),
	`toStatus` varchar(32),
	`paymentId` int,
	`note` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptionHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `subscriptions` MODIFY COLUMN `status` enum('pending','active','paused','cancelled','expired') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `appointments` ADD `membershipCycleId` int;--> statement-breakpoint
ALTER TABLE `partners` ADD `logoKey` varchar(255);--> statement-breakpoint
ALTER TABLE `partners` ADD `logoUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `partners` ADD `websiteUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `partners` ADD `contact` varchar(255);--> statement-breakpoint
ALTER TABLE `partners` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `paymentMethod` enum('card','pix');--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `paymentStatus` enum('pending','approved','declined','cancelled','refunded','expired') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `nextRenewalAt` timestamp;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `cancelledAt` timestamp;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `providerCustomerRef` varchar(191);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `providerSubscriptionRef` varchar(191);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `benefitUsage` ADD CONSTRAINT `benefitUsage_clubMemberId_clubMembers_id_fk` FOREIGN KEY (`clubMemberId`) REFERENCES `clubMembers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `benefitUsage` ADD CONSTRAINT `benefitUsage_membershipCycleId_membershipCycles_id_fk` FOREIGN KEY (`membershipCycleId`) REFERENCES `membershipCycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `benefitUsage` ADD CONSTRAINT `benefitUsage_appointmentId_appointments_id_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `benefitUsage` ADD CONSTRAINT `benefitUsage_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `benefitUsage` ADD CONSTRAINT `benefitUsage_barberId_barbers_id_fk` FOREIGN KEY (`barberId`) REFERENCES `barbers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clubMembers` ADD CONSTRAINT `clubMembers_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customerSessions` ADD CONSTRAINT `customerSessions_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membershipCycles` ADD CONSTRAINT `membershipCycles_subscriptionId_subscriptions_id_fk` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membershipCycles` ADD CONSTRAINT `membershipCycles_clubMemberId_clubMembers_id_fk` FOREIGN KEY (`clubMemberId`) REFERENCES `clubMembers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membershipCycles` ADD CONSTRAINT `membershipCycles_planId_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partnerBenefits` ADD CONSTRAINT `partnerBenefits_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partnerBenefits` ADD CONSTRAINT `partnerBenefits_benefitId_benefits_id_fk` FOREIGN KEY (`benefitId`) REFERENCES `benefits`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_subscriptionId_subscriptions_id_fk` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `planEntitlements` ADD CONSTRAINT `planEntitlements_planId_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `planEntitlements` ADD CONSTRAINT `planEntitlements_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `raffleParticipants` ADD CONSTRAINT `raffleParticipants_raffleId_raffles_id_fk` FOREIGN KEY (`raffleId`) REFERENCES `raffles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `raffleParticipants` ADD CONSTRAINT `raffleParticipants_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `raffles` ADD CONSTRAINT `raffles_winnerCustomerId_customers_id_fk` FOREIGN KEY (`winnerCustomerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rouletteRewards` ADD CONSTRAINT `rouletteRewards_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rouletteRewards` ADD CONSTRAINT `rouletteRewards_benefitId_benefits_id_fk` FOREIGN KEY (`benefitId`) REFERENCES `benefits`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rouletteSpins` ADD CONSTRAINT `rouletteSpins_clubMemberId_clubMembers_id_fk` FOREIGN KEY (`clubMemberId`) REFERENCES `clubMembers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rouletteSpins` ADD CONSTRAINT `rouletteSpins_membershipCycleId_membershipCycles_id_fk` FOREIGN KEY (`membershipCycleId`) REFERENCES `membershipCycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rouletteSpins` ADD CONSTRAINT `rouletteSpins_rewardId_rouletteRewards_id_fk` FOREIGN KEY (`rewardId`) REFERENCES `rouletteRewards`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptionHistory` ADD CONSTRAINT `subscriptionHistory_subscriptionId_subscriptions_id_fk` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptionHistory` ADD CONSTRAINT `subscriptionHistory_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptionHistory` ADD CONSTRAINT `subscriptionHistory_paymentId_payments_id_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `benefitUsage_cycle_kind_idx` ON `benefitUsage` (`membershipCycleId`,`kind`);--> statement-breakpoint
CREATE INDEX `benefitUsage_member_idx` ON `benefitUsage` (`clubMemberId`);--> statement-breakpoint
CREATE INDEX `benefitUsage_appointment_idx` ON `benefitUsage` (`appointmentId`);--> statement-breakpoint
CREATE INDEX `customerSessions_customer_expiry_idx` ON `customerSessions` (`customerId`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `membershipCycles_subscription_idx` ON `membershipCycles` (`subscriptionId`);--> statement-breakpoint
CREATE INDEX `membershipCycles_member_status_idx` ON `membershipCycles` (`clubMemberId`,`status`);--> statement-breakpoint
CREATE INDEX `membershipCycles_dates_idx` ON `membershipCycles` (`startedAt`,`endsAt`);--> statement-breakpoint
CREATE INDEX `partnerBenefits_partner_idx` ON `partnerBenefits` (`partnerId`,`active`);--> statement-breakpoint
CREATE INDEX `partnerBenefits_benefit_idx` ON `partnerBenefits` (`benefitId`);--> statement-breakpoint
CREATE INDEX `payments_subscription_status_idx` ON `payments` (`subscriptionId`,`status`);--> statement-breakpoint
CREATE INDEX `payments_customer_idx` ON `payments` (`customerId`);--> statement-breakpoint
CREATE INDEX `payments_external_ref_idx` ON `payments` (`provider`,`externalPaymentRef`);--> statement-breakpoint
CREATE INDEX `planEntitlements_plan_idx` ON `planEntitlements` (`planId`);--> statement-breakpoint
CREATE INDEX `planEntitlements_service_idx` ON `planEntitlements` (`serviceId`);--> statement-breakpoint
CREATE INDEX `raffleParticipants_customer_idx` ON `raffleParticipants` (`customerId`);--> statement-breakpoint
CREATE INDEX `raffles_status_dates_idx` ON `raffles` (`status`,`startsAt`,`endsAt`);--> statement-breakpoint
CREATE INDEX `rouletteRewards_active_idx` ON `rouletteRewards` (`active`);--> statement-breakpoint
CREATE INDEX `rouletteSpins_cycle_idx` ON `rouletteSpins` (`membershipCycleId`);--> statement-breakpoint
CREATE INDEX `rouletteSpins_reward_idx` ON `rouletteSpins` (`rewardId`);--> statement-breakpoint
CREATE INDEX `subscriptionHistory_subscription_idx` ON `subscriptionHistory` (`subscriptionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `subscriptionHistory_customer_idx` ON `subscriptionHistory` (`customerId`);--> statement-breakpoint
CREATE INDEX `appointments_membership_cycle_idx` ON `appointments` (`membershipCycleId`);
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_membershipCycleId_membershipCycles_id_fk` FOREIGN KEY (`membershipCycleId`) REFERENCES `membershipCycles`(`id`) ON DELETE no action ON UPDATE no action;