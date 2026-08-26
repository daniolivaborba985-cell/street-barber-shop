import { and, desc, eq, gt, gte, inArray, like, lt, ne, or } from "drizzle-orm";
import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import {
  adminSessions,
  appointmentHistory,
  appointments,
  appointmentServices,
  barberServices,
  plans,
  subscriptions,
  barbers,
  blocks,
  customers,
  services,
  users,
  type User,
} from "../drizzle/schema";
import { getDb } from "./db";
import { createAppointment, toUtcTimestamp, type CreateAppointmentInput } from "./appointments";

const scrypt = promisify(nodeScrypt);
export const ADMIN_ROLES = ["admin", "barber", "barbearia"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AdminUser = User;
export const FIXED_PROFILES = [
  { username: "luan", name: "Luan Bringhenti", role: "admin", barberId: 1 },
  { username: "bruno", name: "Bruno Bringhenti", role: "admin", barberId: 2 },
  { username: "kaua", name: "Kauã dos Santos", role: "barber", barberId: 3 },
  { username: "barbearia", name: "Barbearia Street Barber Shop", role: "barbearia", barberId: null },
] as const;
export const isBillableStatus = (status: string) => status !== "cancelled";
export const canAccessBarber = (user: AdminUser, barberId: number) => user.role !== "barber" || user.barberId === barberId;
export const blockPersistence = (kind: CreateBlockInput["kind"]) => kind === "service" ? "appointment" as const : "block" as const;
export const nextAppointmentStatus = (action: "confirmed" | "cancelled" | "completed") => action === "cancelled" ? "cancelled" as const : "confirmed" as const;

export const isAdminRole = (role: string): role is AdminRole => ADMIN_ROLES.includes(role as AdminRole);

export function canViewAll(user: AdminUser) { return user.role === "admin"; }
export function canViewReports(user: AdminUser) { return user.role === "admin" || user.role === "barber"; }
export function canManageUsers(user: AdminUser) { return user.role === "admin"; }
export function scopedBarberId(user: AdminUser): number | undefined {
  return user.role === "barber" ? (user.barberId ?? undefined) : undefined;
}

export function assertAdminUser(user: User | null): asserts user is AdminUser {
  if (!user || !isAdminRole(user.role)) throw new Error("Acesso administrativo negado.");
}

export async function hashPassword(password: string) {
  if (password.length < 10) throw new Error("A senha deve ter pelo menos 10 caracteres.");
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null) {
  if (!stored?.startsWith("scrypt$")) return false;
  const [, salt, digest] = stored.split("$");
  if (!salt || !digest) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(digest, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

const sessionTokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function getUserFromAdminSession(token: string | undefined) {
  if (!token) return undefined;
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select({ session: adminSessions, user: users })
    .from(adminSessions)
    .innerJoin(users, eq(users.id, adminSessions.userId))
    .where(and(eq(adminSessions.tokenHash, sessionTokenHash(token)), gte(adminSessions.expiresAt, new Date())))
    .limit(1);
  return row?.user as User | undefined;
}

export async function loginWithPassword(username: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [user] = await db.select().from(users).where(and(eq(users.username, username.trim().toLowerCase()), inArray(users.role, [...ADMIN_ROLES]))).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw new Error("Usuário ou senha inválidos.");
  const token = randomBytes(32).toString("hex");
  await db.insert(adminSessions).values({
    userId: user.id,
    tokenHash: sessionTokenHash(token),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
  });
  return { token, user };
}

export async function logoutAdminSession(token: string | undefined) {
  const db = await getDb();
  if (db && token) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, sessionTokenHash(token)));
  return { success: true } as const;
}

export async function listStaffUsers(actor: AdminUser) {
  if (!canManageUsers(actor)) throw new Error("Apenas administradores podem gerenciar usuários.");
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, username: users.username, role: users.role, barberId: users.barberId, passwordSetAt: users.passwordSetAt, createdAt: users.createdAt }).from(users).where(and(like(users.openId, "local:%"), inArray(users.role, [...ADMIN_ROLES]))).orderBy(users.name);
}

export async function createStaffUser(actor: AdminUser, input: { name: string; username: string; role: "admin" | "barber" | "barbearia"; barberId?: number; password: string }) {
  if (!canManageUsers(actor)) throw new Error("Apenas administradores podem criar usuários.");
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const username = input.username.trim().toLowerCase();
  if (!username || !input.name.trim()) throw new Error("Informe nome e usuário.");
  const fixedProfiles = await db.select({ id: users.id }).from(users).where(like(users.openId, "local:%"));
  if (fixedProfiles.length >= 4) throw new Error("A operação possui exatamente quatro perfis fixos.");
  const passwordHash = await hashPassword(input.password);
  const inserted = await db.insert(users).values({ openId: `local:${username}`, name: input.name.trim(), username, role: input.role, barberId: input.role === "barber" ? input.barberId ?? null : null, passwordHash, passwordSetAt: new Date(), loginMethod: "local" });
  const [created] = await db.select({ id: users.id, name: users.name, username: users.username, role: users.role, barberId: users.barberId }).from(users).where(eq(users.id, Number(inserted[0].insertId))).limit(1);
  return created;
}

export async function setUserPassword(actor: AdminUser, userId: number, password: string) {
  if (!canManageUsers(actor)) throw new Error("Apenas administradores podem configurar usuários.");
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const passwordHash = await hashPassword(password);
  await db.update(users).set({ passwordHash, passwordSetAt: new Date() }).where(eq(users.id, userId));
  return { success: true } as const;
}

function scopeCondition(user: AdminUser) {
  const barberId = scopedBarberId(user);
  return barberId ? eq(appointments.barberId, barberId) : undefined;
}

export async function listAdminAppointments(user: AdminUser) {
  const db = await getDb();
  if (!db) return [];
  const condition = scopeCondition(user);
  return db.select({
    id: appointments.id,
    appointmentDate: appointments.appointmentDate,
    startTime: appointments.startTime,
    endTime: appointments.endTime,
    totalDurationMinutes: appointments.totalDurationMinutes,
    totalPriceCents: appointments.totalPriceCents,
    status: appointments.status,
    customerName: customers.name,
    customerPhone: customers.phone,
    customerEmail: customers.email,
    barberName: barbers.name,
    barberSlug: barbers.slug,
  }).from(appointments)
    .innerJoin(customers, eq(customers.id, appointments.customerId))
    .innerJoin(barbers, eq(barbers.id, appointments.barberId))
    .where(condition)
    .orderBy(desc(appointments.appointmentDate), desc(appointments.startTime)).limit(500);
}

export async function listAdminCustomers(user: AdminUser) {
  const db = await getDb();
  if (!db) return [];
  const barberId = scopedBarberId(user);
  const rows = await db.select({
    id: customers.id,
    name: customers.name,
    phone: customers.phone,
    email: customers.email,
    createdAt: customers.createdAt,
    appointmentId: appointments.id,
    appointmentDate: appointments.appointmentDate,
    startTime: appointments.startTime,
    barberName: barbers.name,
    status: appointments.status,
  }).from(customers)
    .leftJoin(appointments, eq(appointments.customerId, customers.id))
    .leftJoin(barbers, eq(barbers.id, appointments.barberId))
    .where(barberId ? or(eq(appointments.barberId, barberId), eq(appointments.id, 0)) : undefined)
    .orderBy(desc(customers.createdAt));
  const byId = new Map<number, { id: number; name: string; phone: string; email: string; createdAt: Date; appointments: Array<{ id: number; date: string; time: string; barberName: string | null; status: string; services: string[] }>; plan: string | null; status: string }>();
  for (const row of rows) {
    const existing = byId.get(row.id) ?? { id: row.id, name: row.name, phone: row.phone, email: row.email, createdAt: row.createdAt, appointments: [], plan: null, status: "Novo" };
    if (row.appointmentId) {
      const serviceRows = await db.select({ name: services.name }).from(appointmentServices).innerJoin(services, eq(services.id, appointmentServices.serviceId)).where(eq(appointmentServices.appointmentId, row.appointmentId));
      existing.appointments.push({ id: row.appointmentId, date: row.appointmentDate!, time: row.startTime!.slice(0, 5), barberName: row.barberName, status: row.status!, services: serviceRows.map((service) => service.name) });
      existing.status = row.status === "cancelled" ? "Cancelado" : "Ativo";
    }
    const [subscription] = await db.select({ planName: plans.name, status: subscriptions.status }).from(subscriptions).innerJoin(plans, eq(plans.id, subscriptions.planId)).where(and(eq(subscriptions.customerId, row.id), eq(subscriptions.status, "active"))).limit(1);
    existing.plan = subscription?.planName ?? null;
    byId.set(row.id, existing);
  }
  const today = new Date().toISOString().slice(0, 10);
  return Array.from(byId.values()).map((customer) => {
    const activeAppointments = customer.appointments.filter((appointment) => appointment.status !== "cancelled").sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    return { ...customer, appointmentCount: activeAppointments.length, lastAppointment: activeAppointments.filter((appointment) => appointment.date < today).at(-1) ?? null, nextAppointment: activeAppointments.find((appointment) => appointment.date >= today) ?? null };
  });
}

export async function getAdminDashboard(user: AdminUser) {
  const rows = await listAdminAppointments(user);
  const active = rows.filter((row) => isBillableStatus(row.status));
  const confirmed = rows.filter((row) => row.status === "confirmed");
  return {
    today: rows.filter((row) => row.appointmentDate === new Date().toISOString().slice(0, 10)),
    upcoming: active.slice(0, 8),
    metrics: {
      appointments: rows.length,
      confirmed: confirmed.length,
      cancelled: rows.filter((row) => row.status === "cancelled").length,
      revenueCents: user.role === "barbearia" ? null : active.reduce((sum, row) => sum + row.totalPriceCents, 0),
    },
  };
}

export async function getAdminReport(user: AdminUser, fromDate: string, toDate: string) {
  if (!canViewReports(user)) throw new Error("Este perfil não possui acesso a relatórios.");
  const rows = (await listAdminAppointments(user)).filter((row) => row.appointmentDate >= fromDate && row.appointmentDate <= toDate);
  const active = rows.filter((row) => isBillableStatus(row.status));
  const byBarber = new Map<string, { barberName: string; appointments: number; revenueCents: number; cancellations: number }>();
  for (const row of rows) {
    const current = byBarber.get(row.barberSlug) ?? { barberName: row.barberName, appointments: 0, revenueCents: 0, cancellations: 0 };
    current.appointments += isBillableStatus(row.status) ? 1 : 0;
    current.cancellations += row.status === "cancelled" ? 1 : 0;
    current.revenueCents += isBillableStatus(row.status) ? row.totalPriceCents : 0;
    byBarber.set(row.barberSlug, current);
  }
  return {
    fromDate,
    toDate,
    appointments: active.length,
    cancellations: rows.filter((row) => row.status === "cancelled").length,
    revenueCents: active.reduce((sum, row) => sum + row.totalPriceCents, 0),
    averageTicketCents: active.length ? Math.round(active.reduce((sum, row) => sum + row.totalPriceCents, 0) / active.length) : 0,
    byBarber: Array.from(byBarber.values()),
  };
}

export type CreateBlockInput = {
  barberId: number;
  kind: "personal" | "service";
  appointmentDate: string;
  startTime: string;
  endTime: string;
  note?: string;
  serviceId?: number;
  customerId?: number;
  valueCents?: number;
};

export async function listBlocks(user: AdminUser) {
  const db = await getDb();
  if (!db) return [];
  const barberId = scopedBarberId(user);
  return db.select({
    id: blocks.id,
    barberId: blocks.barberId,
    barberName: barbers.name,
    kind: blocks.kind,
    appointmentDate: blocks.appointmentDate,
    startTime: blocks.startTime,
    endTime: blocks.endTime,
    note: blocks.note,
    valueCents: blocks.valueCents,
    active: blocks.active,
  }).from(blocks).innerJoin(barbers, eq(barbers.id, blocks.barberId))
    .where(barberId ? and(eq(blocks.barberId, barberId), eq(blocks.active, 1)) : eq(blocks.active, 1))
    .orderBy(desc(blocks.appointmentDate), desc(blocks.startTime)).limit(300);
}

export async function createBlock(actor: AdminUser, input: CreateBlockInput) {
  if (!canAccessBarber(actor, input.barberId)) throw new Error("Você só pode bloquear seus próprios horários.");
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const conflicts = await db.select({ id: appointments.id }).from(appointments).where(and(eq(appointments.barberId, input.barberId), eq(appointments.appointmentDate, input.appointmentDate), ne(appointments.status, "cancelled"), lt(appointments.startTime, input.endTime), gt(appointments.endTime, input.startTime))).limit(1);
  if (conflicts[0]) throw new Error("Este horário já possui agendamento.");
  const blockConflicts = await db.select({ id: blocks.id }).from(blocks).where(and(eq(blocks.barberId, input.barberId), eq(blocks.appointmentDate, input.appointmentDate), eq(blocks.active, 1), lt(blocks.startTime, input.endTime), gt(blocks.endTime, input.startTime))).limit(1);
  if (blockConflicts[0]) throw new Error("Este horário já está bloqueado.");
  if (input.kind === "service") {
    if (!input.serviceId || !input.customerId) throw new Error("Um atendimento precisa de serviço e cliente.");
    const [service] = await db.select({ name: services.name, priceCents: barberServices.priceCents, defaultDurationMinutes: barberServices.durationMinutes }).from(barberServices).innerJoin(services, eq(services.id, barberServices.serviceId)).where(and(eq(barberServices.barberId, input.barberId), eq(barberServices.serviceId, input.serviceId))).limit(1);
    const [barber] = await db.select({ id: barbers.id }).from(barbers).where(eq(barbers.id, input.barberId)).limit(1);
    if (!service || !barber) throw new Error("Serviço ou barbeiro não encontrado.");
    const durationMinutes = Math.max(1, (Number(input.endTime.slice(0, 2)) * 60 + Number(input.endTime.slice(3, 5))) - (Number(input.startTime.slice(0, 2)) * 60 + Number(input.startTime.slice(3, 5))));
    const appointmentInsert = await db.insert(appointments).values({ customerId: input.customerId, barberId: input.barberId, appointmentDate: input.appointmentDate, startTime: `${input.startTime}:00`, endTime: `${input.endTime}:00`, scheduledStartUtcMs: toUtcTimestamp(input.appointmentDate, input.startTime), scheduledEndUtcMs: toUtcTimestamp(input.appointmentDate, input.endTime), totalDurationMinutes: durationMinutes || service.defaultDurationMinutes, totalPriceCents: input.valueCents ?? service.priceCents, status: "confirmed" });
    const appointmentId = Number(appointmentInsert[0].insertId);
    await db.insert(appointmentServices).values({ appointmentId, serviceId: input.serviceId, priceCents: input.valueCents ?? service.priceCents, durationMinutes: durationMinutes || service.defaultDurationMinutes });
    await db.insert(appointmentHistory).values({ appointmentId, changedByUserId: actor.id, action: "created", note: input.note });
    return { appointmentId, kind: "service" as const };
  }
  const inserted = await db.insert(blocks).values({ ...input, createdByUserId: actor.id, valueCents: 0 });
  const [created] = await db.select().from(blocks).where(eq(blocks.id, Number(inserted[0].insertId))).limit(1);
  return created;
}

export async function deleteBlock(actor: AdminUser, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [block] = await db.select().from(blocks).where(eq(blocks.id, id)).limit(1);
  if (!block || (actor.role === "barber" && block.barberId !== actor.barberId)) throw new Error("Bloqueio não encontrado ou sem permissão.");
  await db.update(blocks).set({ active: 0, updatedAt: new Date() }).where(eq(blocks.id, id));
  return { success: true } as const;
}

export async function rescheduleAppointment(actor: AdminUser, id: number, next: Pick<CreateAppointmentInput, "appointmentDate" | "startTime">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [current] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  if (!current || !canAccessBarber(actor, current.barberId)) throw new Error("Agendamento não encontrado ou sem permissão.");
  const [serviceRows] = await db.select({ serviceId: appointmentServices.serviceId }).from(appointmentServices).where(eq(appointmentServices.appointmentId, id)).limit(1);
  if (!serviceRows) throw new Error("Agendamento sem serviços associados.");
  const startUtc = new Date(`${next.appointmentDate}T${next.startTime}:00-03:00`);
  const end = new Date(startUtc.getTime() + current.totalDurationMinutes * 60000);
  const endTime = end.toISOString().slice(11, 19);
  const conflict = await db.select({ id: appointments.id }).from(appointments).where(and(eq(appointments.barberId, current.barberId), eq(appointments.appointmentDate, next.appointmentDate), ne(appointments.id, id), ne(appointments.status, "cancelled"), lt(appointments.startTime, endTime), gt(appointments.endTime, `${next.startTime}:00`))).limit(1);
  if (conflict[0]) throw new Error("O novo horário possui conflito.");
  const blocked = await db.select({ id: blocks.id }).from(blocks).where(and(eq(blocks.barberId, current.barberId), eq(blocks.appointmentDate, next.appointmentDate), eq(blocks.active, 1), lt(blocks.startTime, endTime), gt(blocks.endTime, `${next.startTime}:00`))).limit(1);
  if (blocked[0]) throw new Error("O novo horário está bloqueado.");
  await db.transaction(async (tx) => {
    await tx.update(appointments).set({ appointmentDate: next.appointmentDate, startTime: `${next.startTime}:00`, endTime, scheduledStartUtcMs: startUtc.getTime(), scheduledEndUtcMs: end.getTime(), updatedAt: new Date() }).where(eq(appointments.id, id));
    await tx.insert(appointmentHistory).values({ appointmentId: id, changedByUserId: actor.id, action: "rescheduled", previousDate: current.appointmentDate, previousStartTime: current.startTime, previousEndTime: current.endTime });
  });
  return { success: true } as const;
}

export async function recordAppointmentHistory(actor: AdminUser, id: number, action: "confirmed" | "cancelled" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [current] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  if (!current || !canAccessBarber(actor, current.barberId)) throw new Error("Agendamento não encontrado ou sem permissão.");
  const status = nextAppointmentStatus(action);
  await db.transaction(async (tx) => {
    await tx.update(appointments).set({ status, updatedAt: new Date() }).where(eq(appointments.id, id));
    await tx.insert(appointmentHistory).values({ appointmentId: id, changedByUserId: actor.id, action });
  });
  return { success: true } as const;
}
