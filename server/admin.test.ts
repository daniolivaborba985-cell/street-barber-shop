import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./db", () => ({ getDb: vi.fn() }));
import { assertAdminUser, blockPersistence, canAccessBarber, canManageUsers, canViewAll, canViewReports, createBlock, filterBarberScope, FIXED_PROFILES, isLocalStaffUser, getAdminReport, hashPassword, isAdminRole, isBillableStatus, listAdminAppointments, listAdminCustomers, loginWithPassword, nextAppointmentStatus, recordAppointmentHistory, rescheduleAppointment, scopedBarberId, setUserPassword, verifyPassword } from "./admin";
import { getDb } from "./db";
import { listOccupiedSlots } from "./appointments";
import type { User } from "../drizzle/schema";

const makeUser = (role: User["role"], barberId: number | null = null): User => ({
  id: 1, openId: `user-${role}`, name: role, email: `${role}@street.test`, loginMethod: "test", role, barberId,
  username: role, passwordHash: null, passwordSetAt: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
});

const chain = (result: unknown) => { const query: any = {}; query.from = () => query; query.innerJoin = () => query; query.leftJoin = () => query; query.where = () => query; query.orderBy = () => query; query.limit = async () => result; query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve); return query; };
const mockDatabase = (results: unknown[], historyActions: string[] = [], inserts: unknown[] = []) => { let index = 0; return { select: () => chain(results[index++]), insert: () => ({ values: async (value: unknown) => { inserts.push(value); return [{ insertId: 99 }]; } }), transaction: async (callback: (tx: any) => Promise<void>) => callback({ update: () => ({ set: () => ({ where: async () => undefined }) }), insert: () => ({ values: async (value: { action?: string }) => { if (value.action) historyActions.push(value.action); } }) }) }; };

beforeEach(() => { vi.mocked(getDb).mockReset(); });

describe("administrative profile permissions", () => {
  it("defines the four fixed operational profiles", () => {
    expect(FIXED_PROFILES.map((profile) => profile.username)).toEqual(["luanbringhenti2@gmail.com", "brunobringhenti16@gmail.com", "kauadoura14@gmail.com", "streetbarber@gmail.com"]);
    expect(FIXED_PROFILES.filter((profile) => profile.role === "admin")).toHaveLength(2);
    expect(FIXED_PROFILES.find((profile) => profile.username === "kauadoura14@gmail.com")?.barberId).toBe(3);
  });
  it("requires a local session for panel staff access", () => {
    expect(isLocalStaffUser({ loginMethod: "local", role: "barber" } as any)).toBe(true);
    expect(isLocalStaffUser({ loginMethod: "local", role: "barbearia" } as any)).toBe(true);
    expect(isLocalStaffUser({ loginMethod: "google", role: "admin" } as any)).toBe(false);
    expect(isLocalStaffUser({ loginMethod: "local", role: "user" } as any)).toBe(false);
  });

  it("accepts exactly the three staff roles", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("barber")).toBe(true);
    expect(isAdminRole("barbearia")).toBe(true);
    expect(isAdminRole("user")).toBe(false);
  });

  it("limits Kauã to his own barber scope and reports", () => {
    const kaua = makeUser("barber", 3);
    assertAdminUser(kaua);
    expect(scopedBarberId(kaua)).toBe(3);
    expect(canViewAll(kaua)).toBe(false);
    expect(canViewReports(kaua)).toBe(true);
    expect(canManageUsers(kaua)).toBe(false);
  });

  it("enforces Kauã’s real data boundary on agenda and report rows", () => {
    const kaua = makeUser("barber", 3);
    const rows = [{ barberId: 1, id: "luan" }, { barberId: 2, id: "bruno" }, { barberId: 3, id: "kaua" }];
    expect(filterBarberScope(kaua, rows)).toEqual([{ barberId: 3, id: "kaua" }]);
    expect(canAccessBarber(kaua, 3)).toBe(true);
    expect(canAccessBarber(kaua, 1)).toBe(false);
    expect(canAccessBarber(kaua, 2)).toBe(false);
  });

  it("keeps Barbearia operational and without financial reports", () => {
    const operation = makeUser("barbearia");
    assertAdminUser(operation);
    expect(scopedBarberId(operation)).toBeUndefined();
    expect(canViewAll(operation)).toBe(false);
    expect(canViewReports(operation)).toBe(false);
    expect(canManageUsers(operation)).toBe(false);
  });
});

describe("administrative billing rules", () => {
  it("counts every non-cancelled appointment once and excludes cancelled ones", () => {
    expect(isBillableStatus("pending")).toBe(true);
    expect(isBillableStatus("confirmed")).toBe(true);
    expect(isBillableStatus("cancelled")).toBe(false);
  });
});

describe("administrative integration contracts", () => {
  it("executes the real appointment listing and isolates Kauã by barberId", async () => {
    vi.mocked(getDb).mockResolvedValue(mockDatabase([[{ id: 1, barberId: 1 }, { id: 3, barberId: 3 }]]) as any);
    const rows = await listAdminAppointments(makeUser("barber", 3));
    expect(rows).toEqual([{ id: 3, barberId: 3 }]);
  });

  it("executes the real customer query and excludes Luan/Bruno appointments for Kauã", async () => {
    const createdAt = new Date("2030-01-01T00:00:00Z");
    vi.mocked(getDb).mockResolvedValue(mockDatabase([[{ id: 7, name: "Cliente", phone: "555555555", email: "cliente@test", createdAt, appointmentId: 1, appointmentBarberId: 1, appointmentDate: "2030-01-10", startTime: "09:00:00", barberName: "Luan", status: "confirmed" }, { id: 7, name: "Cliente", phone: "555555555", email: "cliente@test", createdAt, appointmentId: 2, appointmentBarberId: 3, appointmentDate: "2030-01-11", startTime: "10:00:00", barberName: "Kauã", status: "confirmed" }], [], []], [], []) as any);
    const customers = await listAdminCustomers(makeUser("barber", 3));
    expect(customers[0]?.appointments).toHaveLength(1);
    expect(customers[0]?.appointments[0]?.barberName).toBe("Kauã");
  });

  it("executes the real report query with only Kauã’s barber rows", async () => {
    const row = (barberId: number, barberName: string, barberSlug: string) => ({ id: barberId, barberId, appointmentDate: "2030-01-10", startTime: "09:00:00", endTime: "09:30:00", totalDurationMinutes: 30, totalPriceCents: 3500, status: "confirmed", customerName: "Cliente", customerPhone: "555555555", customerEmail: "cliente@test", barberName, barberSlug });
    vi.mocked(getDb).mockResolvedValue(mockDatabase([[row(1, "Luan", "luan"), row(3, "Kauã", "kaua")]]) as any);
    const report = await getAdminReport(makeUser("barber", 3), "2030-01-01", "2030-01-31");
    expect(report.appointments).toBe(1);
    expect(report.byBarber).toEqual([{ barberName: "Kauã", appointments: 1, revenueCents: 3500, cancellations: 0 }]);
  });

  it("records a real cancellation history event without changing appointment identity", async () => {
    const actions: string[] = [];
    vi.mocked(getDb).mockResolvedValue(mockDatabase([[{ id: 12, barberId: 3 }]], actions) as any);
    const result = await recordAppointmentHistory(makeUser("barber", 3), 12, "cancelled");
    expect(result).toEqual({ success: true });
    expect(actions).toEqual(["cancelled"]);
  });

  it("excludes a cancelled appointment from the real report after recording history", async () => {
    const state: any = { id: 12, barberId: 3, appointmentDate: "2030-01-10", startTime: "09:00:00", endTime: "09:30:00", totalDurationMinutes: 30, totalPriceCents: 3500, status: "confirmed", customerName: "Cliente", customerPhone: "555", customerEmail: "cliente@test", barberName: "Kauã", barberSlug: "kaua" };
    const db: any = { select: () => chain([state]), transaction: async (callback: (tx: any) => Promise<void>) => callback({ update: () => ({ set: (values: any) => ({ where: async () => Object.assign(state, values) }) }), insert: () => ({ values: async () => undefined }) }) };
    vi.mocked(getDb).mockResolvedValue(db);
    await recordAppointmentHistory(makeUser("barber", 3), 12, "cancelled");
    const report = await getAdminReport(makeUser("barber", 3), "2030-01-01", "2030-01-31");
    expect(report.appointments).toBe(0);
    expect(report.cancellations).toBe(1);
    expect(report.revenueCents).toBe(0);
  });

  it("keeps one billable report row after rescheduling the same appointment", async () => {
    const state: any = { id: 12, barberId: 3, appointmentDate: "2030-01-10", startTime: "09:00:00", endTime: "09:30:00", totalDurationMinutes: 30, totalPriceCents: 3500, status: "confirmed", customerName: "Cliente", customerPhone: "555", customerEmail: "cliente@test", barberName: "Kauã", barberSlug: "kaua" };
    let calls = 0;
    const db: any = { select: () => { calls += 1; return chain(calls === 1 ? [state] : calls === 2 ? [{ serviceId: 1 }] : calls <= 4 ? [] : [state]); }, transaction: async (callback: (tx: any) => Promise<void>) => callback({ update: () => ({ set: (values: any) => ({ where: async () => Object.assign(state, values) }) }), insert: () => ({ values: async () => undefined }) }) };
    vi.mocked(getDb).mockResolvedValue(db);
    await rescheduleAppointment(makeUser("barber", 3), 12, { appointmentDate: "2030-01-11", startTime: "10:00" });
    const report = await getAdminReport(makeUser("barber", 3), "2030-01-01", "2030-01-31");
    expect(report.appointments).toBe(1);
    expect(report.revenueCents).toBe(3500);
  });

  it("reschedules the same appointment and records one history event", async () => {
    const actions: string[] = [];
    vi.mocked(getDb).mockResolvedValue(mockDatabase([[{ id: 12, barberId: 3, appointmentDate: "2030-01-10", startTime: "09:00:00", endTime: "09:30:00", totalDurationMinutes: 30 }], [{ serviceId: 1 }], [], []], actions) as any);
    const result = await rescheduleAppointment(makeUser("barber", 3), 12, { appointmentDate: "2030-01-11", startTime: "10:00" });
    expect(result).toEqual({ success: true });
    expect(actions).toEqual(["rescheduled"]);
  });
});

describe("administrative operations", () => {
  it("keeps personal blocks non-billable and service blocks as real appointments", () => {
    expect(blockPersistence("personal")).toBe("block");
    expect(blockPersistence("service")).toBe("appointment");
  });

  it("reads appointments and active blocks through the shared public calendar query", async () => {
    vi.mocked(getDb).mockResolvedValue(mockDatabase([[{ id: 3 }], [{ startTime: "10:00:00", endTime: "10:30:00" }], [{ startTime: "12:00:00", endTime: "13:00:00" }]]) as any);
    await expect(listOccupiedSlots("kaua", "2030-02-01")).resolves.toEqual([{ startTime: "10:00", endTime: "10:30" }, { startTime: "12:00", endTime: "13:00" }]);
  });

  it("executes block creation and then exposes the same personal block in the public calendar", async () => {
    const state: { appointments: any[]; blocks: any[] } = { appointments: [], blocks: [] };
    let call = 0;
    const db = { select: () => { call += 1; const result = call === 1 || call === 2 ? [] : call === 3 ? [{ id: 99, barberId: 1 }] : call === 4 ? [{ id: 1 }] : call === 5 ? state.appointments : state.blocks; return chain(result); }, insert: () => ({ values: async (value: any) => { if (value.kind === "personal") state.blocks.push({ startTime: `${value.startTime}:00`, endTime: `${value.endTime}:00` }); return [{ insertId: 99 }]; } }) };
    vi.mocked(getDb).mockResolvedValue(db as any);
    await createBlock(makeUser("admin"), { barberId: 1, kind: "personal", appointmentDate: "2030-02-01", startTime: "12:00", endTime: "13:00" });
    await expect(listOccupiedSlots("luan", "2030-02-01")).resolves.toEqual([{ startTime: "12:00", endTime: "13:00" }]);
  });

  it("executes service block creation and then exposes the real appointment in the public calendar", async () => {
    const state: { appointments: any[]; blocks: any[] } = { appointments: [], blocks: [] };
    let call = 0;
    const db = { select: () => { call += 1; const result = call === 1 || call === 2 ? [] : call === 3 ? [{ name: "Corte", priceCents: 3500, defaultDurationMinutes: 30 }] : call === 4 ? [{ id: 1 }] : call === 5 ? [{ id: 1 }] : call === 6 ? state.appointments : state.blocks; return chain(result); }, insert: () => ({ values: async (value: any) => { if (value.customerId) state.appointments.push({ startTime: `${value.startTime}`, endTime: `${value.endTime}` }); return [{ insertId: 99 }]; } }) };
    vi.mocked(getDb).mockResolvedValue(db as any);
    await createBlock(makeUser("admin"), { barberId: 1, kind: "service", appointmentDate: "2030-02-01", startTime: "14:00", endTime: "14:30", serviceId: 1, customerId: 7, valueCents: 4000 });
    await expect(listOccupiedSlots("luan", "2030-02-01")).resolves.toEqual([{ startTime: "14:00", endTime: "14:30" }]);
  });

  it("executes both block modes with the correct persistence target", async () => {
    const personalInserts: unknown[] = [];
    vi.mocked(getDb).mockResolvedValue(mockDatabase([[], [], [{ id: 99, barberId: 1 }]], [], personalInserts) as any);
    await createBlock(makeUser("admin"), { barberId: 1, kind: "personal", appointmentDate: "2030-02-01", startTime: "12:00", endTime: "13:00", note: "Almoço" });
    expect(personalInserts[0]).toMatchObject({ kind: "personal", valueCents: 0 });

    const serviceInserts: unknown[] = [];
    vi.mocked(getDb).mockResolvedValue(mockDatabase([[], [], [{ name: "Corte", priceCents: 3500, defaultDurationMinutes: 30 }], [{ id: 1 }]], [], serviceInserts) as any);
    const result = await createBlock(makeUser("admin"), { barberId: 1, kind: "service", appointmentDate: "2030-02-01", startTime: "14:00", endTime: "14:30", serviceId: 1, customerId: 7, valueCents: 4000, note: "Atendimento" });
    expect(result).toEqual({ appointmentId: 99, kind: "service" });
    expect(serviceInserts).toHaveLength(3);
    expect(serviceInserts[0]).toMatchObject({ customerId: 7, barberId: 1, totalPriceCents: 4000 });
    expect(serviceInserts[1]).toMatchObject({ appointmentId: 99, serviceId: 1, priceCents: 4000 });
    expect(serviceInserts[2]).toMatchObject({ appointmentId: 99, action: "created" });
  });

  it("maps status actions without creating a second billable appointment", () => {
    expect(nextAppointmentStatus("cancelled")).toBe("cancelled");
    expect(nextAppointmentStatus("confirmed")).toBe("confirmed");
    expect(nextAppointmentStatus("completed")).toBe("confirmed");
  });
});

describe("administrative password provisioning", () => {
  it("provisions a fixed profile hash and authenticates with it", async () => {
    const user: any = { ...makeUser("admin"), id: 21, username: "luanbringhenti2@gmail.com", openId: "local:luan", passwordHash: null };
    const db: any = { select: () => chain([user]), update: () => ({ set: (values: any) => ({ where: async () => Object.assign(user, values) }) }), insert: () => ({ values: async () => [{ insertId: 1 }] }) };
    vi.mocked(getDb).mockResolvedValue(db);
    await setUserPassword(makeUser("admin"), 21, "street-login-password");
    expect(user.passwordHash).toMatch(/^scrypt\$/);
    expect(user.passwordHash).not.toContain("street-login-password");
    const result = await loginWithPassword("luanbringhenti2@gmail.com", "street-login-password");
    expect(result.user.id).toBe(21);
  });
});

describe("administrative login", () => {
  it("authenticates a fixed local profile and creates a session without storing plaintext", async () => {
    const password = "street-login-password";
    const user = { ...makeUser("admin"), username: "luanbringhenti2@gmail.com", openId: "local:luan", passwordHash: await hashPassword(password) };
    vi.mocked(getDb).mockResolvedValue(mockDatabase([[user]]) as any);
    const result = await loginWithPassword("luanbringhenti2@gmail.com", password);
    expect(result.user.username).toBe("luanbringhenti2@gmail.com");
    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(user.passwordHash).not.toContain(password);
  });
});

describe("administrative credentials", () => {
  it("hashes passwords and never verifies against plaintext", async () => {
    const password = "street-secure-password";
    const digest = await hashPassword(password);
    expect(digest).toMatch(/^scrypt\$/);
    expect(digest).not.toContain(password);
    await expect(verifyPassword(password, digest)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", digest)).resolves.toBe(false);
    await expect(hashPassword("short")).rejects.toThrow("10 caracteres");
  });
});
