import { describe, expect, it } from "vitest";
import { availableBenefitQuantity, buildEntitlementsSnapshot, canReusePendingSubscription, cycleEndsAt } from "./club";

describe("Street Barber Clube", () => {
  it("calcula ciclos com duração exata de 30 dias", () => {
    const startedAt = new Date("2026-08-27T12:00:00.000Z");
    expect(cycleEndsAt(startedAt).toISOString()).toBe("2026-09-26T12:00:00.000Z");
  });

  it("preserva um snapshot independente dos entitlements do plano", () => {
    const snapshot = buildEntitlementsSnapshot([
      { id: 1, planId: 2, kind: "cuts", serviceId: null, quantity: 4, discountPercent: null, description: "Cortes", active: 1, createdAt: new Date() },
      { id: 2, planId: 2, kind: "eyebrow", serviceId: 3, quantity: 1, discountPercent: null, description: "Sobrancelha", active: 1, createdAt: new Date() },
    ] as any);
    expect(snapshot).toEqual([
      { kind: "cuts", serviceId: null, quantity: 4, discountPercent: null, description: "Cortes" },
      { kind: "eyebrow", serviceId: 3, quantity: 1, discountPercent: null, description: "Sobrancelha" },
    ]);
  });

  it("calcula saldo sem misturar cortes, barbas e sobrancelha", () => {
    const snapshot = [
      { kind: "cuts", serviceId: null, quantity: 4, discountPercent: null, description: null },
      { kind: "beards", serviceId: null, quantity: 2, discountPercent: null, description: null },
      { kind: "eyebrow", serviceId: 3, quantity: 1, discountPercent: null, description: null },
    ] as any;
    const usage = [
      { kind: "cut", quantity: 1 },
      { kind: "beard", quantity: 2 },
    ] as const;
    expect(availableBenefitQuantity(snapshot, usage, "cut")).toBe(3);
    expect(availableBenefitQuantity(snapshot, usage, "beard")).toBe(0);
    expect(availableBenefitQuantity(snapshot, usage, "eyebrow")).toBe(1);
  });

  it("reutiliza somente a contratação pendente do mesmo plano, barbeiro e método", () => {
    expect(canReusePendingSubscription({ status: "pending", planId: 2, barberId: 1, paymentMethod: "card" }, { planId: 2, barberId: 1, paymentMethod: "card" })).toBe(true);
    expect(canReusePendingSubscription({ status: "pending", planId: 2, barberId: 1, paymentMethod: "card" }, { planId: 2, barberId: 3, paymentMethod: "card" })).toBe(false);
    expect(canReusePendingSubscription({ status: "active", planId: 2, barberId: 1, paymentMethod: "card" }, { planId: 2, barberId: 1, paymentMethod: "card" })).toBe(false);
  });

  it("não permite que a área VIP seja acessada sem sessão de cliente", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: null, req: { headers: {} } as any, res: {} as any });
    await expect(caller.club.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("lista somente barbeiros ativos para o seletor do Clube", async () => {
    const { getClubBarbers } = await import("./club");
    const rows = await getClubBarbers();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.slug && row.name && row.assistantName)).toBe(true);
  });

  it("rejeita barbeiro inexistente antes de criar a contratação", async () => {
    const { requestSubscription } = await import("./club");
    await expect(requestSubscription({ name: "Cliente Teste", phone: "48999999999", email: "teste-barber@invalid.local", planSlug: "2-cortes", barberSlug: "barbeiro-inexistente", paymentMethod: "pix" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
