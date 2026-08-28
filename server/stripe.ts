import express, { type Express } from "express";
import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { clubMembers, membershipCycles, payments, planEntitlements, plans, subscriptionHistory, subscriptions, customers } from "../drizzle/schema";

export class StripeConfigurationError extends Error {
  code = "PRECONDITION_FAILED" as const;
}

function getStripe() {
  if (!ENV.stripeSecretKey) throw new StripeConfigurationError("O pagamento ainda não está configurado. A equipe precisa definir as chaves Stripe em Settings → Payment.");
  return new Stripe(ENV.stripeSecretKey);
}

export function getOrigin(origin: string | undefined) {
  return origin || "http://localhost:3000";
}

export function buildClubPaymentOptions(paymentMethod: "card" | "pix", priceCents: number, planName: string, mode: "subscription" | "payment") {
  if (paymentMethod === "card") return { payment_method_types: ["card"], payment_method_options: undefined };
  if (mode === "payment") return { payment_method_types: ["pix" as const], payment_method_options: undefined, adaptive_pricing: { enabled: false } };
  return {
    payment_method_options: {
      pix: {
        mandate_options: {
          amount: priceCents,
          payment_schedule: "monthly" as const,
        },
      },
    },
  };
}

type PixConfigurationCandidate = {
  id: string;
  name?: string | null;
  application?: string | null;
  is_default?: boolean | null;
  pix?: {
    available?: boolean | null;
    display_preference?: { value?: string | null; preference?: string | null } | null;
  } | null;
};

export function selectPixPaymentMethodConfiguration(configurations: PixConfigurationCandidate[]) {
  const eligible = configurations
    .filter((configuration) => {
      const displayValue = configuration.pix?.display_preference?.value ?? configuration.pix?.display_preference?.preference;
      return configuration.application == null && configuration.pix?.available === true && displayValue !== "off";
    })
    .sort((left, right) => {
      const score = (configuration: PixConfigurationCandidate) => {
        const nameScore = configuration.name?.toLowerCase().includes("pix") ? 2 : 0;
        return nameScore + Number(configuration.is_default ?? false);
      };
      return score(right) - score(left);
    });
  return eligible[0]?.id ?? null;
}

async function getPixPaymentMethodConfiguration(stripe: Stripe) {
  const configurations = await stripe.paymentMethodConfigurations.list({ limit: 100 });
  const configurationId = selectPixPaymentMethodConfiguration(configurations.data);
  if (!configurationId) throw new StripeConfigurationError("PIX ainda não está habilitado na configuração de pagamentos da Stripe.");
  return configurationId;
}

export async function createClubCheckoutSession(customerId: number, subscriptionId: number, origin?: string) {
  const db = await getDb();
  if (!db) throw new StripeConfigurationError("Banco indisponível para iniciar o pagamento.");
  const [row] = await db.select({ subscription: subscriptions, customer: customers, plan: plans }).from(subscriptions).innerJoin(customers, eq(subscriptions.customerId, customers.id)).innerJoin(plans, eq(subscriptions.planId, plans.id)).where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.customerId, customerId), eq(subscriptions.status, "pending"))).limit(1);
  if (!row) throw new StripeConfigurationError("Não encontramos uma contratação pendente para este cliente.");
  const stripe = getStripe();
  const paymentMethod = row.subscription.paymentMethod || "card";
  const checkoutMode = paymentMethod === "pix" ? "payment" : "subscription";
  const paymentOptions = buildClubPaymentOptions(paymentMethod, row.plan.priceCents, row.plan.name, checkoutMode);
  const session = await stripe.checkout.sessions.create({
    mode: checkoutMode,
    customer_email: row.customer.email,
    client_reference_id: String(row.customer.id),
    allow_promotion_codes: true,
    ...paymentOptions,

    ...(checkoutMode === "subscription" ? { payment_method_collection: "always" as const } : {}),
    line_items: [{ price_data: { currency: "brl", unit_amount: row.plan.priceCents, product_data: { name: `Street Barber Clube · ${row.plan.name}`, description: checkoutMode === "payment" ? "Ciclo de 30 dias do Street Barber Clube" : "Plano mensal Street Barber Clube", ...(checkoutMode === "subscription" ? { recurring: { interval: "month" as const } } : {}) } }, quantity: 1 }],
    metadata: { subscription_id: String(row.subscription.id), customer_id: String(row.customer.id), customer_email: row.customer.email, customer_name: row.customer.name, plan_slug: row.plan.slug, payment_method: paymentMethod, checkout_mode: checkoutMode },
    ...(checkoutMode === "subscription" ? { subscription_data: { metadata: { subscription_id: String(row.subscription.id), customer_id: String(row.customer.id), plan_slug: row.plan.slug, payment_method: paymentMethod } } } : {}),
    success_url: `${getOrigin(origin)}/clube?checkout=success`,
    cancel_url: `${getOrigin(origin)}/clube?checkout=cancelled`,
  });
  await db.update(payments).set({ provider: "stripe", externalPaymentRef: session.id }).where(and(eq(payments.subscriptionId, subscriptionId), eq(payments.status, "pending")));
  return { checkoutUrl: session.url, sessionId: session.id };
}

async function activateSubscriptionFromStripe(subscriptionId: number, paymentIntentRef?: string | null, providerCustomerRef?: string | null, providerSubscriptionRef?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.transaction(async (tx) => {
    const [row] = await tx.select({ subscription: subscriptions, member: clubMembers, plan: plans }).from(subscriptions).innerJoin(clubMembers, eq(clubMembers.customerId, subscriptions.customerId)).innerJoin(plans, eq(plans.id, subscriptions.planId)).where(eq(subscriptions.id, subscriptionId)).limit(1);
    if (!row) return;
    const [pendingPayment] = await tx.select().from(payments).where(and(eq(payments.subscriptionId, subscriptionId), eq(payments.status, "pending"))).limit(1);
    const now = new Date();
    await tx.update(subscriptions).set({ status: "active", paymentStatus: "approved", providerCustomerRef: providerCustomerRef || row.subscription.providerCustomerRef, providerSubscriptionRef: providerSubscriptionRef || row.subscription.providerSubscriptionRef, startedAt: row.subscription.startedAt || now, nextRenewalAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), updatedAt: now }).where(eq(subscriptions.id, subscriptionId));
    await tx.update(clubMembers).set({ status: "active", updatedAt: now }).where(eq(clubMembers.id, row.member.id));
    if (pendingPayment) {
      await tx.update(payments).set({ status: "approved", provider: "stripe", externalPaymentRef: paymentIntentRef || pendingPayment.externalPaymentRef, paidAt: now, updatedAt: now }).where(eq(payments.id, pendingPayment.id));
      await tx.insert(subscriptionHistory).values({ subscriptionId, customerId: row.subscription.customerId, event: "payment_approved", fromStatus: "pending", toStatus: "active", paymentId: pendingPayment.id, note: "Pagamento confirmado pelo Stripe." });
    }
    const [activeCycle] = await tx.select({ id: membershipCycles.id }).from(membershipCycles).where(and(eq(membershipCycles.subscriptionId, subscriptionId), eq(membershipCycles.status, "active"))).limit(1);
    if (!activeCycle) {
      const entitlements = await tx.select().from(planEntitlements).where(and(eq(planEntitlements.planId, row.plan.id), eq(planEntitlements.active, 1)));
      const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await tx.insert(membershipCycles).values({ subscriptionId, clubMemberId: row.member.id, planId: row.plan.id, status: "active", startedAt: now, endsAt, nextRenewalAt: endsAt, entitlementsSnapshot: entitlements.map((item) => ({ kind: item.kind, serviceId: item.serviceId ?? null, quantity: item.quantity, discountPercent: item.discountPercent ?? null, description: item.description ?? null })) });
    }
  });
}

async function handleStripeEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId = Number(session.metadata?.subscription_id);
    const isPix = session.metadata?.payment_method === "pix";
    const canActivate = event.type === "checkout.session.async_payment_succeeded" || !isPix || session.payment_status === "paid";
    if (canActivate && Number.isInteger(subscriptionId) && subscriptionId > 0) await activateSubscriptionFromStripe(subscriptionId, typeof session.payment_intent === "string" ? session.payment_intent : null, typeof session.customer === "string" ? session.customer : null, typeof session.subscription === "string" ? session.subscription : null);
  }
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null; payment_intent?: string | Stripe.PaymentIntent | null };
    const providerSubscriptionRef = typeof invoice.subscription === "string" ? invoice.subscription : null;
    if (providerSubscriptionRef) {
      const db = await getDb();
      const [local] = db ? await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.providerSubscriptionRef, providerSubscriptionRef)).limit(1) : [];
      if (local) await activateSubscriptionFromStripe(local.id, typeof invoice.payment_intent === "string" ? invoice.payment_intent : null, typeof invoice.customer === "string" ? invoice.customer : null, providerSubscriptionRef);
    }
  }
}

export function registerStripeWebhook(app: Express) {
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!ENV.stripeWebhookSecret) return res.status(503).json({ error: "Stripe webhook não configurado." });
    let event: Stripe.Event;
    try {
      const signature = req.headers["stripe-signature"];
      event = getStripe().webhooks.constructEvent(req.body, signature as string, ENV.stripeWebhookSecret);
    } catch (error) {
      return res.status(400).json({ error: `Webhook Stripe inválido: ${error instanceof Error ? error.message : "assinatura inválida"}` });
    }
    if (event.id.startsWith("evt_test_")) return res.json({ verified: true });
    try { await handleStripeEvent(event); return res.json({ received: true }); } catch (error) { console.error("[Stripe Webhook] processing failed", error); return res.status(500).json({ error: "Falha ao processar webhook." }); }
  });
}

export async function createClubCheckoutForRequest(subscriptionId: number, email: string, phone: string, origin?: string) {
  const db = await getDb();
  if (!db) throw new StripeConfigurationError("Banco indisponível para iniciar o pagamento.");
  const [row] = await db.select({ customerId: customers.id }).from(subscriptions).innerJoin(customers, eq(subscriptions.customerId, customers.id)).where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.status, "pending"), eq(customers.email, email.trim().toLowerCase()), eq(customers.phone, phone.trim()))).limit(1);
  if (!row) throw new StripeConfigurationError("Não encontramos essa contratação pendente com os dados informados.");
  return createClubCheckoutSession(row.customerId, subscriptionId, origin);
}
