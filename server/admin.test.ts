import { describe, expect, it } from "vitest";
import { assertAdminUser, blockPersistence, canAccessBarber, canManageUsers, canViewAll, canViewReports, FIXED_PROFILES, hashPassword, isAdminRole, isBillableStatus, nextAppointmentStatus, scopedBarberId, verifyPassword } from "./admin";
import type { User } from "../drizzle/schema";

const makeUser = (role: User["role"], barberId: number | null = null): User => ({
  id: 1, openId: `user-${role}`, name: role, email: `${role}@street.test`, loginMethod: "test", role, barberId,
  username: role, passwordHash: null, passwordSetAt: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
});

describe("administrative profile permissions", () => {
  it("defines the four fixed operational profiles", () => {
    expect(FIXED_PROFILES.map((profile) => profile.username)).toEqual(["luan", "bruno", "kaua", "barbearia"]);
    expect(FIXED_PROFILES.filter((profile) => profile.role === "admin")).toHaveLength(2);
    expect(FIXED_PROFILES.find((profile) => profile.username === "kaua")?.barberId).toBe(3);
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

  it("enforces Kauã’s real data boundary by barber id", () => {
    const kaua = makeUser("barber", 3);
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

describe("administrative operations", () => {
  it("keeps personal blocks non-billable and service blocks as real appointments", () => {
    expect(blockPersistence("personal")).toBe("block");
    expect(blockPersistence("service")).toBe("appointment");
  });

  it("maps status actions without creating a second billable appointment", () => {
    expect(nextAppointmentStatus("cancelled")).toBe("cancelled");
    expect(nextAppointmentStatus("confirmed")).toBe("confirmed");
    expect(nextAppointmentStatus("completed")).toBe("confirmed");
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
