import { describe, expect, it, vi } from "vitest";
vi.mock("./db", () => ({ getDb: vi.fn() }));
import {
  AppointmentValidationError,
  intervalsOverlap,
  validateAppointmentRequest,
  toUtcTimestamp,
  listOccupiedSlots,
} from "./appointments";
import { getDb } from "./db";

const awaitable = (result: unknown) => { const query: any = {}; query.from = () => query; query.innerJoin = () => query; query.where = () => query; query.limit = async () => result; query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve); return query; };

describe("appointment validation", () => {
  it("calculates the total duration and end time for multiple services", () => {
    const result = validateAppointmentRequest({
      barberSlug: "luan",
      name: "Cliente de Teste",
      phone: "49999999999",
      email: "cliente@example.com",
      serviceSlugs: ["corte", "barba"],
      appointmentDate: "2026-08-29",
      startTime: "19:00",
    });

    expect(result.totalDurationMinutes).toBe(45);
    expect(result.endTime).toBe("19:45:00");
    expect(result.totalPriceCents).toBe(6000);
  });

  it("rejects Sundays and Mondays", () => {
    expect(() => validateAppointmentRequest({
      barberSlug: "bruno",
      name: "Cliente de Teste",
      phone: "54999999999",
      email: "cliente@example.com",
      serviceSlugs: ["corte"],
      appointmentDate: "2026-08-30",
      startTime: "10:00",
    })).toThrow("terça a sábado");
  });

  it("rejects a service that would finish after closing time", () => {
    expect(() => validateAppointmentRequest({
      barberSlug: "kaua",
      name: "Cliente de Teste",
      phone: "54999999999",
      email: "cliente@example.com",
      serviceSlugs: ["corte"],
      appointmentDate: "2026-08-29",
      startTime: "19:45",
    })).toThrow(AppointmentValidationError);
  });

  it("persists local business time as explicit UTC epochs", () => {
    expect(new Date(toUtcTimestamp("2026-08-29", "10:00:00")).toISOString()).toBe("2026-08-29T13:00:00.000Z");
  });

  it("detects overlapping intervals but allows adjacent appointments", () => {
    expect(intervalsOverlap("10:00:00", "10:30:00", "10:15:00", "10:45:00")).toBe(true);
    expect(intervalsOverlap("10:00:00", "10:30:00", "10:30:00", "11:00:00")).toBe(false);
  });
});


describe("panel booking and shared calendar", () => {
  it("creates one panel appointment and exposes it through public occupied slots", async () => {
    const state: any = { appointment: null };
    let txSelect = 0;
    const tx = {
      select: () => { txSelect += 1; const result = txSelect === 1 ? [{ id: 1 }] : txSelect === 2 ? [{ id: 1, slug: "corte", priceCents: 3500, durationMinutes: 30 }] : txSelect <= 4 ? [] : txSelect === 5 ? [{ id: 1 }] : txSelect === 6 ? [] : [state.appointment]; return awaitable(result); },
      insert: () => ({ values: async (value: any) => { if (value.customerId && value.barberId) { state.appointment = { id: 99, ...value }; } return [{ insertId: value.customerId ? 7 : 99 }]; } }),
      update: () => ({ set: () => ({ where: async () => undefined }) }),
    };
    let calendarSelect = 0;
    const db = {
      transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx),
      select: () => { calendarSelect += 1; const result = calendarSelect === 1 ? [{ id: 1 }] : calendarSelect === 2 ? [{ startTime: "10:00:00", endTime: "10:30:00" }] : []; return awaitable(result); },
    };
    vi.mocked(getDb).mockResolvedValue(db as any);
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: { id: 10, role: "admin", openId: "local:luan", loginMethod: "local", username: "luanbringhenti2@gmail.com" } as any, req: { protocol: "https", headers: {} } as never, res: {} as never });
    await caller.appointments.createFromPanel({ barberSlug: "luan", name: "Cliente Painel", phone: "49999999999", email: "painel@example.com", serviceSlugs: ["corte"], appointmentDate: "2026-08-29", startTime: "10:00" });
    await expect(listOccupiedSlots("luan", "2026-08-29")).resolves.toEqual([{ startTime: "10:00", endTime: "10:30" }]);
  });
});

describe("appointment administration", () => {
  it("requires an authenticated administrator for the appointment list", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as never,
      res: {} as never,
    });

    await expect(caller.appointments.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
