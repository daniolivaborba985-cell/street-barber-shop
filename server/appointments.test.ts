import { describe, expect, it } from "vitest";
import {
  AppointmentValidationError,
  intervalsOverlap,
  validateAppointmentRequest,
  toUtcTimestamp,
} from "./appointments";

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
