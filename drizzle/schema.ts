import {
  bigint,
  date,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  time,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "barber", "barbearia"]).default("user").notNull(),
  barberId: int("barberId"),
  username: varchar("username", { length: 96 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  passwordSetAt: timestamp("passwordSetAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const barbers = mysqlTable("barbers", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  assistantName: varchar("assistantName", { length: 64 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  instagram: varchar("instagram", { length: 128 }).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("barbers_slug_idx").on(table.slug),
}));

export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("services_slug_idx").on(table.slug),
}));

export const barberServices = mysqlTable("barberServices", {
  barberId: int("barberId").notNull().references(() => barbers.id),
  serviceId: int("serviceId").notNull().references(() => services.id),
  priceCents: int("priceCents").notNull(),
  durationMinutes: int("durationMinutes").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.barberId, table.serviceId] }),
}));

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  phoneIdx: index("customers_phone_idx").on(table.phone),
  emailIdx: index("customers_email_idx").on(table.email),
}));

export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  priceCents: int("priceCents").notNull(),
  oldPriceCents: int("oldPriceCents").notNull(),
  economyCents: int("economyCents").notNull(),
  note: varchar("note", { length: 500 }).notNull(),
  details: json("details").$type<string[]>().notNull(),
  featured: int("featured").default(0).notNull(),
  tone: mysqlEnum("tone", ["purple", "yellow"]).default("purple").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("plans_slug_idx").on(table.slug),
}));

export const benefits = mysqlTable("benefits", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const planBenefits = mysqlTable("planBenefits", {
  planId: int("planId").notNull().references(() => plans.id),
  benefitId: int("benefitId").notNull().references(() => benefits.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.planId, table.benefitId] }),
}));

export const partners = mysqlTable("partners", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  logoKey: varchar("logoKey", { length: 255 }),
  logoUrl: varchar("logoUrl", { length: 500 }),
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  contact: varchar("contact", { length: 255 }),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const availability = mysqlTable("availability", {
  id: int("id").autoincrement().primaryKey(),
  barberId: int("barberId").notNull().references(() => barbers.id),
  weekday: int("weekday").notNull(),
  startTime: time("startTime").notNull(),
  endTime: time("endTime").notNull(),
  active: int("active").default(1).notNull(),
}, (table) => ({
  barberDayIdx: index("availability_barber_day_idx").on(table.barberId, table.weekday),
}));

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().references(() => customers.id),
  planId: int("planId").notNull().references(() => plans.id),
  status: mysqlEnum("status", ["pending", "active", "paused", "cancelled", "expired"]).default("pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["card", "pix"]),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "approved", "declined", "cancelled", "refunded", "expired"]).default("pending").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  nextRenewalAt: timestamp("nextRenewalAt"),
  cancelledAt: timestamp("cancelledAt"),
  providerCustomerRef: varchar("providerCustomerRef", { length: 191 }),
  providerSubscriptionRef: varchar("providerSubscriptionRef", { length: 191 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const appointmentStatuses = ["pending", "confirmed", "cancelled"] as const;

export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().references(() => customers.id),
  membershipCycleId: int("membershipCycleId").references(() => membershipCycles.id),
  barberId: int("barberId").notNull().references(() => barbers.id),
  appointmentDate: date("appointmentDate", { mode: "string" }).notNull(),
  startTime: time("startTime").notNull(),
  endTime: time("endTime").notNull(),
  scheduledStartUtcMs: bigint("scheduledStartUtcMs", { mode: "number" }).notNull(),
  scheduledEndUtcMs: bigint("scheduledEndUtcMs", { mode: "number" }).notNull(),
  totalDurationMinutes: int("totalDurationMinutes").notNull(),
  totalPriceCents: int("totalPriceCents").notNull(),
  status: mysqlEnum("status", appointmentStatuses).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  scheduleIdx: index("appointments_schedule_idx").on(table.barberId, table.appointmentDate, table.startTime),
  statusIdx: index("appointments_status_idx").on(table.status),
  membershipCycleIdx: index("appointments_membership_cycle_idx").on(table.membershipCycleId),
}));

export const blocks = mysqlTable("blocks", {
  id: int("id").autoincrement().primaryKey(),
  barberId: int("barberId").notNull().references(() => barbers.id),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  kind: mysqlEnum("kind", ["personal", "service"]).notNull(),
  appointmentDate: date("appointmentDate", { mode: "string" }).notNull(),
  startTime: time("startTime").notNull(),
  endTime: time("endTime").notNull(),
  note: varchar("note", { length: 500 }),
  serviceId: int("serviceId").references(() => services.id),
  customerId: int("customerId").references(() => customers.id),
  valueCents: int("valueCents").default(0).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  scheduleIdx: index("blocks_schedule_idx").on(table.barberId, table.appointmentDate, table.startTime),
}));

export const appointmentHistory = mysqlTable("appointmentHistory", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull().references(() => appointments.id),
  changedByUserId: int("changedByUserId").references(() => users.id),
  action: mysqlEnum("action", ["created", "rescheduled", "confirmed", "cancelled", "completed"]).notNull(),
  previousDate: date("previousDate", { mode: "string" }),
  previousStartTime: time("previousStartTime"),
  previousEndTime: time("previousEndTime"),
  note: varchar("note", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const adminSessions = mysqlTable("adminSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const appointmentServices = mysqlTable("appointmentServices", {
  appointmentId: int("appointmentId").notNull().references(() => appointments.id),
  serviceId: int("serviceId").notNull().references(() => services.id),
  priceCents: int("priceCents").notNull(),
  durationMinutes: int("durationMinutes").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.appointmentId, table.serviceId] }),
}));

export const clubMembers = mysqlTable("clubMembers", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().references(() => customers.id),
  status: mysqlEnum("status", ["pending", "active", "cancelled", "expired", "suspended"]).default("pending").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  customerUnique: uniqueIndex("clubMembers_customer_unique").on(table.customerId),
}));

export const planEntitlements = mysqlTable("planEntitlements", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull().references(() => plans.id),
  kind: mysqlEnum("kind", ["cuts", "beards", "service", "eyebrow", "discount", "benefit"]).notNull(),
  serviceId: int("serviceId").references(() => services.id),
  quantity: int("quantity").default(0).notNull(),
  discountPercent: int("discountPercent"),
  description: varchar("description", { length: 500 }),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  planIdx: index("planEntitlements_plan_idx").on(table.planId),
  serviceIdx: index("planEntitlements_service_idx").on(table.serviceId),
}));

export const membershipCycles = mysqlTable("membershipCycles", {
  id: int("id").autoincrement().primaryKey(),
  subscriptionId: int("subscriptionId").notNull().references(() => subscriptions.id),
  clubMemberId: int("clubMemberId").notNull().references(() => clubMembers.id),
  planId: int("planId").notNull().references(() => plans.id),
  status: mysqlEnum("status", ["pending", "active", "closed", "expired"]).default("pending").notNull(),
  startedAt: timestamp("startedAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  nextRenewalAt: timestamp("nextRenewalAt"),
  entitlementsSnapshot: json("entitlementsSnapshot").$type<Array<{ kind: "cuts" | "beards" | "service" | "eyebrow" | "discount" | "benefit"; serviceId: number | null; quantity: number; discountPercent: number | null; description: string | null }>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  subscriptionIdx: index("membershipCycles_subscription_idx").on(table.subscriptionId),
  memberStatusIdx: index("membershipCycles_member_status_idx").on(table.clubMemberId, table.status),
  datesIdx: index("membershipCycles_dates_idx").on(table.startedAt, table.endsAt),
}));

export const benefitUsage = mysqlTable("benefitUsage", {
  id: int("id").autoincrement().primaryKey(),
  clubMemberId: int("clubMemberId").notNull().references(() => clubMembers.id),
  membershipCycleId: int("membershipCycleId").notNull().references(() => membershipCycles.id),
  appointmentId: int("appointmentId").references(() => appointments.id),
  serviceId: int("serviceId").references(() => services.id),
  barberId: int("barberId").references(() => barbers.id),
  kind: mysqlEnum("kind", ["cut", "beard", "eyebrow", "discount", "benefit"]).notNull(),
  quantity: int("quantity").default(1).notNull(),
  usedAt: timestamp("usedAt").defaultNow().notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 191 }).notNull(),
  note: varchar("note", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  idempotencyUnique: uniqueIndex("benefitUsage_idempotency_unique").on(table.idempotencyKey),
  cycleKindIdx: index("benefitUsage_cycle_kind_idx").on(table.membershipCycleId, table.kind),
  memberIdx: index("benefitUsage_member_idx").on(table.clubMemberId),
  appointmentIdx: index("benefitUsage_appointment_idx").on(table.appointmentId),
}));

export const customerSessions = mysqlTable("customerSessions", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().references(() => customers.id),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tokenUnique: uniqueIndex("customerSessions_token_unique").on(table.tokenHash),
  customerExpiryIdx: index("customerSessions_customer_expiry_idx").on(table.customerId, table.expiresAt),
}));

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  subscriptionId: int("subscriptionId").notNull().references(() => subscriptions.id),
  customerId: int("customerId").notNull().references(() => customers.id),
  method: mysqlEnum("method", ["card", "pix"]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "declined", "cancelled", "refunded", "expired"]).default("pending").notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  provider: varchar("provider", { length: 64 }),
  externalPaymentRef: varchar("externalPaymentRef", { length: 191 }),
  idempotencyKey: varchar("idempotencyKey", { length: 191 }).notNull(),
  dueAt: timestamp("dueAt"),
  paidAt: timestamp("paidAt"),
  failureReason: varchar("failureReason", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idempotencyUnique: uniqueIndex("payments_idempotency_unique").on(table.idempotencyKey),
  subscriptionStatusIdx: index("payments_subscription_status_idx").on(table.subscriptionId, table.status),
  customerIdx: index("payments_customer_idx").on(table.customerId),
  externalRefIdx: index("payments_external_ref_idx").on(table.provider, table.externalPaymentRef),
}));

export const subscriptionHistory = mysqlTable("subscriptionHistory", {
  id: int("id").autoincrement().primaryKey(),
  subscriptionId: int("subscriptionId").notNull().references(() => subscriptions.id),
  customerId: int("customerId").notNull().references(() => customers.id),
  event: mysqlEnum("event", ["created", "payment_pending", "payment_approved", "payment_declined", "renewed", "cancelled", "expired", "refunded"]).notNull(),
  fromStatus: varchar("fromStatus", { length: 32 }),
  toStatus: varchar("toStatus", { length: 32 }),
  paymentId: int("paymentId").references(() => payments.id),
  note: varchar("note", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  subscriptionIdx: index("subscriptionHistory_subscription_idx").on(table.subscriptionId, table.createdAt),
  customerIdx: index("subscriptionHistory_customer_idx").on(table.customerId),
}));

export const partnerBenefits = mysqlTable("partnerBenefits", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull().references(() => partners.id),
  benefitId: int("benefitId").references(() => benefits.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  discountPercent: int("discountPercent"),
  validFrom: date("validFrom", { mode: "string" }),
  validUntil: date("validUntil", { mode: "string" }),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  partnerIdx: index("partnerBenefits_partner_idx").on(table.partnerId, table.active),
  benefitIdx: index("partnerBenefits_benefit_idx").on(table.benefitId),
}));

export const raffles = mysqlTable("raffles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  campaign: varchar("campaign", { length: 255 }).notNull(),
  prize: varchar("prize", { length: 500 }).notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  drawAt: timestamp("drawAt").notNull(),
  status: mysqlEnum("status", ["draft", "open", "closed", "drawn", "cancelled"]).default("draft").notNull(),
  winnerCustomerId: int("winnerCustomerId").references(() => customers.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusDatesIdx: index("raffles_status_dates_idx").on(table.status, table.startsAt, table.endsAt),
}));

export const raffleParticipants = mysqlTable("raffleParticipants", {
  id: int("id").autoincrement().primaryKey(),
  raffleId: int("raffleId").notNull().references(() => raffles.id),
  customerId: int("customerId").notNull().references(() => customers.id),
  status: mysqlEnum("status", ["eligible", "removed", "winner"]).default("eligible").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ({
  raffleCustomerUnique: uniqueIndex("raffleParticipants_raffle_customer_unique").on(table.raffleId, table.customerId),
  customerIdx: index("raffleParticipants_customer_idx").on(table.customerId),
}));

export const rouletteRewards = mysqlTable("rouletteRewards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  rewardType: mysqlEnum("rewardType", ["percent_discount", "fixed_discount", "free_service", "benefit"]).notNull(),
  discountPercent: int("discountPercent"),
  discountCents: int("discountCents"),
  serviceId: int("serviceId").references(() => services.id),
  benefitId: int("benefitId").references(() => benefits.id),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  activeIdx: index("rouletteRewards_active_idx").on(table.active),
}));

export const rouletteSpins = mysqlTable("rouletteSpins", {
  id: int("id").autoincrement().primaryKey(),
  clubMemberId: int("clubMemberId").notNull().references(() => clubMembers.id),
  membershipCycleId: int("membershipCycleId").notNull().references(() => membershipCycles.id),
  rewardId: int("rewardId").notNull().references(() => rouletteRewards.id),
  status: mysqlEnum("status", ["consumed", "reversed"]).default("consumed").notNull(),
  spunAt: timestamp("spunAt").defaultNow().notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 191 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  memberCycleUnique: uniqueIndex("rouletteSpins_member_cycle_unique").on(table.clubMemberId, table.membershipCycleId),
  idempotencyUnique: uniqueIndex("rouletteSpins_idempotency_unique").on(table.idempotencyKey),
  cycleIdx: index("rouletteSpins_cycle_idx").on(table.membershipCycleId),
  rewardIdx: index("rouletteSpins_reward_idx").on(table.rewardId),
}));

export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  sessions: many(adminSessions),
  blocks: many(blocks),
  history: many(appointmentHistory),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
  appointments: many(appointments),
  subscriptions: many(subscriptions),
}));

export const barbersRelations = relations(barbers, ({ many }) => ({
  services: many(barberServices),
  availability: many(availability),
  appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  barbers: many(barberServices),
  appointments: many(appointmentServices),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  benefits: many(planBenefits),
  subscriptions: many(subscriptions),
}));

export const benefitsRelations = relations(benefits, ({ many }) => ({
  plans: many(planBenefits),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  customer: one(customers, { fields: [appointments.customerId], references: [customers.id] }),
  barber: one(barbers, { fields: [appointments.barberId], references: [barbers.id] }),
  services: many(appointmentServices),
  history: many(appointmentHistory),
}));

export const barberServicesRelations = relations(barberServices, ({ one }) => ({
  barber: one(barbers, { fields: [barberServices.barberId], references: [barbers.id] }),
  service: one(services, { fields: [barberServices.serviceId], references: [services.id] }),
}));

export const appointmentServicesRelations = relations(appointmentServices, ({ one }) => ({
  appointment: one(appointments, { fields: [appointmentServices.appointmentId], references: [appointments.id] }),
  service: one(services, { fields: [appointmentServices.serviceId], references: [services.id] }),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  barber: one(barbers, { fields: [availability.barberId], references: [barbers.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  customer: one(customers, { fields: [subscriptions.customerId], references: [customers.id] }),
  plan: one(plans, { fields: [subscriptions.planId], references: [plans.id] }),
}));

export const blocksRelations = relations(blocks, ({ one }) => ({
  barber: one(barbers, { fields: [blocks.barberId], references: [barbers.id] }),
  createdBy: one(users, { fields: [blocks.createdByUserId], references: [users.id] }),
  service: one(services, { fields: [blocks.serviceId], references: [services.id] }),
  customer: one(customers, { fields: [blocks.customerId], references: [customers.id] }),
}));

export const appointmentHistoryRelations = relations(appointmentHistory, ({ one }) => ({
  appointment: one(appointments, { fields: [appointmentHistory.appointmentId], references: [appointments.id] }),
  changedBy: one(users, { fields: [appointmentHistory.changedByUserId], references: [users.id] }),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  user: one(users, { fields: [adminSessions.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Barber = typeof barbers.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Block = typeof blocks.$inferSelect;
export type AppointmentHistory = typeof appointmentHistory.$inferSelect;
export type AdminSession = typeof adminSessions.$inferSelect;
