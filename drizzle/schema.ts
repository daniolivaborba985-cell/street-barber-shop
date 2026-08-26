import {
  bigint,
  date,
  index,
  int,
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
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  status: mysqlEnum("status", ["active", "paused", "cancelled"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});

export const appointmentStatuses = ["pending", "confirmed", "cancelled"] as const;

export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().references(() => customers.id),
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
