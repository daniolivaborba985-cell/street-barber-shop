import { createHash, randomBytes } from "node:crypto";
import { and, asc, count, desc, eq, gt, isNull, or } from "drizzle-orm";
import type { Request } from "express";
import {
  benefits,
  benefitUsage,
  barbers,
  clubMembers,
  customers,
  customerSessions,
  membershipCycles,
  partners,
  partnerBenefits,
  payments,
  planEntitlements,
  plans,
  raffleParticipants,
  raffles,
  rouletteRewards,
  rouletteSpins,
  subscriptionHistory,
  subscriptions,
  type Customer,
} from "../drizzle/schema";
import { getDb } from "./db";

export const CUSTOMER_SESSION_COOKIE = "street_customer_session";
const CUSTOMER_SESSION_DAYS = 7;

type PlanEntitlement = typeof planEntitlements.$inferSelect;
type ClubPlan = typeof plans.$inferSelect & { entitlements: PlanEntitlement[] };
export type BenefitKind = "cut" | "beard" | "eyebrow" | "discount" | "benefit";

type SnapshotEntry = {
  kind: "cuts" | "beards" | "service" | "eyebrow" | "discount" | "benefit";
  serviceId: number | null;
  quantity: number;
  discountPercent: number | null;
  description: string | null;
};

export class ClubError extends Error {
  code: "BAD_REQUEST" | "UNAUTHORIZED" | "CONFLICT" | "NOT_FOUND";

  constructor(message: string, code: ClubError["code"] = "BAD_REQUEST") {
    super(message);
    this.name = "ClubError";
    this.code = code;
  }
}

function requireDb() {
  return getDb().then((db) => {
    if (!db) throw new ClubError("Banco de dados indisponível.", "BAD_REQUEST");
    return db;
  });
}

function readCookie(request: Pick<Request, "headers">, name: string) {
  const header = request.headers.cookie;
  const part = header?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : undefined;
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function cycleEndsAt(startedAt: Date) {
  return addDays(startedAt, 30);
}

export function buildEntitlementsSnapshot(entitlements: PlanEntitlement[]): SnapshotEntry[] {
  return entitlements.map((item) => ({
    kind: item.kind,
    serviceId: item.serviceId ?? null,
    quantity: item.quantity,
    discountPercent: item.discountPercent ?? null,
    description: item.description ?? null,
  }));
}

function entitlementKindForUsage(kind: BenefitKind): SnapshotEntry["kind"][] {
  if (kind === "cut") return ["cuts"];
  if (kind === "beard") return ["beards"];
  return [kind];
}

export function availableBenefitQuantity(snapshot: SnapshotEntry[], usage: Array<{ kind: BenefitKind; quantity: number }>, kind: BenefitKind) {
  const allowedKinds = entitlementKindForUsage(kind);
  const allowed = snapshot.filter((item) => allowedKinds.includes(item.kind)).reduce((sum, item) => sum + item.quantity, 0);
  const consumed = usage.filter((item) => item.kind === kind).reduce((sum, item) => sum + item.quantity, 0);
  return Math.max(0, allowed - consumed);
}

export async function getClubPlans(): Promise<ClubPlan[]> {
  const db = await requireDb();
  const planRows = await db.select().from(plans).where(eq(plans.active, 1)).orderBy(asc(plans.id));
  const entitlementRows = await db.select().from(planEntitlements).where(eq(planEntitlements.active, 1)).orderBy(asc(planEntitlements.planId), asc(planEntitlements.id));
  const byPlan = new Map<number, PlanEntitlement[]>();
  for (const entitlement of entitlementRows) {
    const current = byPlan.get(entitlement.planId) ?? [];
    current.push(entitlement);
    byPlan.set(entitlement.planId, current);
  }
  return planRows.map((plan) => ({ ...plan, entitlements: byPlan.get(plan.id) ?? [] }));
}

export async function getClubPlanBySlug(slug: string) {
  const plansList = await getClubPlans();
  const plan = plansList.find((item) => item.slug === slug);
  if (!plan) throw new ClubError("Plano não encontrado.", "NOT_FOUND");
  return plan;
}

export async function getClubBarbers() {
  const db = await requireDb();
  return db.select({ id: barbers.id, slug: barbers.slug, name: barbers.name, assistantName: barbers.assistantName }).from(barbers).where(eq(barbers.active, 1)).orderBy(asc(barbers.id));
}

async function findOrCreateCustomer(tx: any, input: { name: string; phone: string; email: string }) {
  const [existing] = await tx.select().from(customers).where(and(eq(customers.phone, input.phone), eq(customers.email, input.email))).limit(1);
  if (existing) {
    if (existing.name !== input.name) await tx.update(customers).set({ name: input.name, updatedAt: new Date() }).where(eq(customers.id, existing.id));
    return existing.id;
  }
  const inserted = await tx.insert(customers).values({ name: input.name, phone: input.phone, email: input.email });
  return Number(inserted[0].insertId);
}

export async function requestSubscription(input: { name: string; phone: string; email: string; planSlug: string; barberSlug: string; paymentMethod: "card" | "pix" }) {
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const [plan] = await tx.select().from(plans).where(and(eq(plans.slug, input.planSlug), eq(plans.active, 1))).limit(1);
    if (!plan) throw new ClubError("Plano não encontrado.", "NOT_FOUND");
    const [barber] = await tx.select({ id: barbers.id, slug: barbers.slug }).from(barbers).where(and(eq(barbers.slug, input.barberSlug), eq(barbers.active, 1))).limit(1);
    if (!barber) throw new ClubError("Barbeiro não encontrado ou indisponível.", "NOT_FOUND");
    const customerId = await findOrCreateCustomer(tx, input);
    const [existing] = await tx.select({ id: subscriptions.id }).from(subscriptions).where(and(eq(subscriptions.customerId, customerId), or(eq(subscriptions.status, "active"), eq(subscriptions.status, "pending")))).limit(1);
    if (existing) throw new ClubError("Você já possui uma contratação pendente ou uma assinatura ativa.", "CONFLICT");

    const [member] = await tx.select().from(clubMembers).where(eq(clubMembers.customerId, customerId)).limit(1);
    let clubMemberId: number;
    if (member) {
      clubMemberId = member.id;
      await tx.update(clubMembers).set({ status: "pending", updatedAt: new Date() }).where(eq(clubMembers.id, member.id));
    } else {
      const memberInsert = await tx.insert(clubMembers).values({ customerId, status: "pending" });
      clubMemberId = Number(memberInsert[0].insertId);
    }

    const subscriptionInsert = await tx.insert(subscriptions).values({
      customerId,
      planId: plan.id,
      barberId: barber.id,
      status: "pending",
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      startedAt: new Date(),
    });
    const subscriptionId = Number(subscriptionInsert[0].insertId);
    const idempotencyKey = `club-request:${subscriptionId}:${randomBytes(12).toString("hex")}`;
    const paymentInsert = await tx.insert(payments).values({
      subscriptionId,
      customerId,
      method: input.paymentMethod,
      status: "pending",
      amountCents: plan.priceCents,
      idempotencyKey,
    });
    const paymentId = Number(paymentInsert[0].insertId);
    await tx.insert(subscriptionHistory).values({ subscriptionId, customerId, event: "created", fromStatus: null, toStatus: "pending", paymentId, note: `Solicitação do plano ${plan.slug}.` });
    return { customerId, clubMemberId, subscriptionId, paymentId, planSlug: plan.slug, barberSlug: barber.slug, status: "pending" as const };
  });
}

export async function getCustomerFromRequest(request: Pick<Request, "headers">): Promise<Customer | null> {
  const token = readCookie(request, CUSTOMER_SESSION_COOKIE);
  if (!token) return null;
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select({ customer: customers }).from(customerSessions).innerJoin(customers, eq(customerSessions.customerId, customers.id)).where(and(eq(customerSessions.tokenHash, hashSessionToken(token)), isNull(customerSessions.revokedAt), gt(customerSessions.expiresAt, new Date()))).limit(1);
  return row?.customer ?? null;
}

export async function loginCustomer(email: string, phone: string) {
  const db = await requireDb();
  const [customer] = await db.select().from(customers).where(and(eq(customers.email, email.trim().toLowerCase()), eq(customers.phone, phone.trim()))).limit(1);
  if (!customer) throw new ClubError("Não encontramos um cliente com esse e-mail e telefone.", "UNAUTHORIZED");
  const token = randomBytes(32).toString("hex");
  await db.insert(customerSessions).values({ customerId: customer.id, tokenHash: hashSessionToken(token), expiresAt: addDays(new Date(), CUSTOMER_SESSION_DAYS) });
  return { token, customer };
}

export async function logoutCustomer(request: Pick<Request, "headers">) {
  const token = readCookie(request, CUSTOMER_SESSION_COOKIE);
  if (!token) return;
  const db = await getDb();
  if (!db) return;
  await db.update(customerSessions).set({ revokedAt: new Date() }).where(eq(customerSessions.tokenHash, hashSessionToken(token)));
}

export async function getVipDashboard(customerId: number) {
  const db = await requireDb();
  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  if (!customer) throw new ClubError("Cliente não encontrado.", "NOT_FOUND");
  const [member] = await db.select().from(clubMembers).where(eq(clubMembers.customerId, customerId)).limit(1);
  if (!member) return { customer, member: null, subscription: null, cycle: null, usage: [] as Array<{ kind: BenefitKind; quantity: number }> };
  const [subscription] = await db.select({ subscription: subscriptions, plan: plans }).from(subscriptions).innerJoin(plans, eq(subscriptions.planId, plans.id)).where(eq(subscriptions.customerId, customerId)).orderBy(desc(subscriptions.id)).limit(1);
  const [cycle] = await db.select({ cycle: membershipCycles, plan: plans }).from(membershipCycles).innerJoin(plans, eq(membershipCycles.planId, plans.id)).where(and(eq(membershipCycles.clubMemberId, member.id), eq(membershipCycles.status, "active"))).orderBy(desc(membershipCycles.id)).limit(1);
  const usageRows = cycle ? await db.select({ kind: benefitUsage.kind, quantity: benefitUsage.quantity }).from(benefitUsage).where(eq(benefitUsage.membershipCycleId, cycle.cycle.id)).orderBy(asc(benefitUsage.usedAt)) : [];
  const usage = usageRows.map((item) => ({ kind: item.kind as BenefitKind, quantity: item.quantity }));
  const balance = cycle ? {
    cut: availableBenefitQuantity(cycle.cycle.entitlementsSnapshot, usage, "cut"),
    beard: availableBenefitQuantity(cycle.cycle.entitlementsSnapshot, usage, "beard"),
    eyebrow: availableBenefitQuantity(cycle.cycle.entitlementsSnapshot, usage, "eyebrow"),
  } : null;
  return { customer, member, subscription: subscription ?? null, cycle: cycle ? { ...cycle.cycle, plan: cycle.plan } : null, usage, balance };
}

export async function consumeBenefit(input: { clubMemberId: number; membershipCycleId: number; kind: BenefitKind; quantity: number; idempotencyKey: string; appointmentId?: number; serviceId?: number; barberId?: number; note?: string }) {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) throw new ClubError("A quantidade precisa ser maior que zero.");
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(benefitUsage).where(eq(benefitUsage.idempotencyKey, input.idempotencyKey)).limit(1);
    if (existing) return { usage: existing, replayed: true as const };
    const [cycle] = await tx.select().from(membershipCycles).where(and(eq(membershipCycles.id, input.membershipCycleId), eq(membershipCycles.clubMemberId, input.clubMemberId), eq(membershipCycles.status, "active"))).limit(1);
    if (!cycle || cycle.endsAt.getTime() <= Date.now()) throw new ClubError("O ciclo VIP não está ativo.", "CONFLICT");
    const usedRows = await tx.select({ kind: benefitUsage.kind, quantity: benefitUsage.quantity }).from(benefitUsage).where(eq(benefitUsage.membershipCycleId, cycle.id));
    const available = availableBenefitQuantity(cycle.entitlementsSnapshot, usedRows as Array<{ kind: BenefitKind; quantity: number }>, input.kind);
    if (available < input.quantity) throw new ClubError("Esse benefício não possui saldo disponível.", "CONFLICT");
    const inserted = await tx.insert(benefitUsage).values({ clubMemberId: input.clubMemberId, membershipCycleId: input.membershipCycleId, appointmentId: input.appointmentId, serviceId: input.serviceId, barberId: input.barberId, kind: input.kind, quantity: input.quantity, idempotencyKey: input.idempotencyKey, note: input.note });
    const [usage] = await tx.select().from(benefitUsage).where(eq(benefitUsage.id, Number(inserted[0].insertId))).limit(1);
    return { usage, replayed: false as const };
  });
}

export async function listClubPartners() {
  const db = await requireDb();
  const partnerRows = await db.select().from(partners).where(eq(partners.active, 1)).orderBy(asc(partners.id));
  const benefitRows = await db.select({ partnerBenefit: partnerBenefits, benefit: benefits }).from(partnerBenefits).leftJoin(benefits, eq(partnerBenefits.benefitId, benefits.id)).where(eq(partnerBenefits.active, 1)).orderBy(asc(partnerBenefits.partnerId), asc(partnerBenefits.id));
  return partnerRows.map((partner) => ({ ...partner, benefits: benefitRows.filter((row) => row.partnerBenefit.partnerId === partner.id).map((row) => ({ ...row.partnerBenefit, benefit: row.benefit })) }));
}

export async function listOpenRaffles() {
  const db = await requireDb();
  const rows = await db.select().from(raffles).where(eq(raffles.status, "open")).orderBy(asc(raffles.drawAt));
  return Promise.all(rows.map(async (raffle) => {
    const [count] = await db.select({ total: raffleParticipants.id }).from(raffleParticipants).where(eq(raffleParticipants.raffleId, raffle.id)).limit(1);
    return { ...raffle, hasParticipants: Boolean(count) };
  }));
}

export async function joinRaffle(customerId: number, raffleId: number) {
  const db = await requireDb();
  const [member] = await db.select({ id: clubMembers.id }).from(clubMembers).where(and(eq(clubMembers.customerId, customerId), eq(clubMembers.status, "active"))).limit(1);
  if (!member) throw new ClubError("Ative seu Clube para participar do sorteio.", "CONFLICT");
  const [raffle] = await db.select().from(raffles).where(and(eq(raffles.id, raffleId), eq(raffles.status, "open"))).limit(1);
  if (!raffle) throw new ClubError("Esta campanha não está aberta.", "NOT_FOUND");
  const [existing] = await db.select().from(raffleParticipants).where(and(eq(raffleParticipants.raffleId, raffleId), eq(raffleParticipants.customerId, customerId))).limit(1);
  if (existing && existing.status !== "removed") return { participant: existing, replayed: true as const };
  if (existing) {
    await db.update(raffleParticipants).set({ status: "eligible", joinedAt: new Date() }).where(eq(raffleParticipants.id, existing.id));
    const [participant] = await db.select().from(raffleParticipants).where(eq(raffleParticipants.id, existing.id)).limit(1);
    return { participant, replayed: false as const };
  }
  const inserted = await db.insert(raffleParticipants).values({ raffleId, customerId, status: "eligible" });
  const [participant] = await db.select().from(raffleParticipants).where(eq(raffleParticipants.id, Number(inserted[0].insertId))).limit(1);
  return { participant, replayed: false as const };
}

export async function getCustomerRaffles(customerId: number) {
  const db = await requireDb();
  return db.select({ participant: raffleParticipants, raffle: raffles }).from(raffleParticipants).innerJoin(raffles, eq(raffleParticipants.raffleId, raffles.id)).where(eq(raffleParticipants.customerId, customerId)).orderBy(desc(raffles.drawAt));
}

export async function getAdminClubReport() {
  const db = await requireDb();
  const [activeMembers] = await db.select({ total: count() }).from(clubMembers).where(eq(clubMembers.status, "active"));
  const [pendingMembers] = await db.select({ total: count() }).from(clubMembers).where(eq(clubMembers.status, "pending"));
  const [activeCycles] = await db.select({ total: count() }).from(membershipCycles).where(eq(membershipCycles.status, "active"));
  const [pendingPayments] = await db.select({ total: count() }).from(payments).where(eq(payments.status, "pending"));
  const [consumedBenefits] = await db.select({ total: count() }).from(benefitUsage);
  const [openRaffles] = await db.select({ total: count() }).from(raffles).where(eq(raffles.status, "open"));
  const [rouletteSpinsCount] = await db.select({ total: count() }).from(rouletteSpins).where(eq(rouletteSpins.status, "consumed"));
  return { activeMembers: Number(activeMembers?.total ?? 0), pendingMembers: Number(pendingMembers?.total ?? 0), activeCycles: Number(activeCycles?.total ?? 0), pendingPayments: Number(pendingPayments?.total ?? 0), consumedBenefits: Number(consumedBenefits?.total ?? 0), openRaffles: Number(openRaffles?.total ?? 0), rouletteSpins: Number(rouletteSpinsCount?.total ?? 0) };
}

export async function spinRoulette(customerId: number, idempotencyKey: string) {
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const [member] = await tx.select().from(clubMembers).where(and(eq(clubMembers.customerId, customerId), eq(clubMembers.status, "active"))).limit(1);
    if (!member) throw new ClubError("Ative seu Clube para girar a roleta.", "CONFLICT");
    const [cycle] = await tx.select().from(membershipCycles).where(and(eq(membershipCycles.clubMemberId, member.id), eq(membershipCycles.status, "active"), gt(membershipCycles.endsAt, new Date()))).orderBy(desc(membershipCycles.id)).limit(1);
    if (!cycle) throw new ClubError("Não há um ciclo VIP ativo para este giro.", "CONFLICT");
    const [existing] = await tx.select().from(rouletteSpins).where(eq(rouletteSpins.idempotencyKey, idempotencyKey)).limit(1);
    if (existing) return { spin: existing, replayed: true as const };
    const [alreadySpun] = await tx.select().from(rouletteSpins).where(and(eq(rouletteSpins.clubMemberId, member.id), eq(rouletteSpins.membershipCycleId, cycle.id), eq(rouletteSpins.status, "consumed"))).limit(1);
    if (alreadySpun) throw new ClubError("Você já utilizou o giro deste ciclo.", "CONFLICT");
    const rewards = await tx.select().from(rouletteRewards).where(eq(rouletteRewards.active, 1)).orderBy(asc(rouletteRewards.id));
    if (!rewards.length) throw new ClubError("A roleta ainda não possui recompensas configuradas.", "CONFLICT");
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    const inserted = await tx.insert(rouletteSpins).values({ clubMemberId: member.id, membershipCycleId: cycle.id, rewardId: reward.id, idempotencyKey });
    const [spin] = await tx.select().from(rouletteSpins).where(eq(rouletteSpins.id, Number(inserted[0].insertId))).limit(1);
    return { spin: { ...spin, reward }, replayed: false as const };
  });
}
