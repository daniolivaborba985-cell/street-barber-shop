import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { createAppointment, AppointmentConflictError, AppointmentValidationError, listOccupiedSlots } from "./appointments";
import { getSessionCookieOptions } from "./_core/cookies";
import { ADMIN_SESSION_COOKIE } from "./_core/context";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, customerProcedure, publicProcedure, reportProcedure, router, staffProcedure } from "./_core/trpc";
import { ClubError, CUSTOMER_SESSION_COOKIE, consumeBenefit, getAdminClubReport, getClubPlanBySlug, getClubPlans, getCustomerRaffles, getCustomerFromRequest, getVipDashboard, joinRaffle, listClubPartners, listOpenRaffles, loginCustomer, logoutCustomer, requestSubscription, spinRoulette } from "./club";
import {
  createBlock,
  deleteBlock,
  listBlocks,
  getAdminDashboard,
  getAdminReport,
  listAdminAppointments,
  listAdminCustomers,
  listStaffUsers,
  loginWithPassword,
  logoutAdminSession,
  recordAppointmentHistory,
  rescheduleAppointment,
  setUserPassword,
  assertAdminUser,
  canViewFinance,
} from "./admin";

const appointmentInput = z.object({
  barberSlug: z.enum(["luan", "bruno", "kaua"]),
  name: z.string().trim().min(2).max(255),
  phone: z.string().trim().min(8).max(32),
  email: z.string().trim().email().max(320),
  serviceSlugs: z.array(z.string().trim().min(1)).min(1).max(5),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const adminDateRange = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  barberSlug: z.enum(["luan", "bruno", "kaua"]).optional(),
});

function mapClubError(error: unknown): never {
  if (error instanceof ClubError) throw new TRPCError({ code: error.code, message: error.message });
  console.error("[Club] Unexpected error:", error);
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível concluir a operação do Clube." });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure.input(z.object({ username: z.string().min(3), password: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      try {
        const result = await loginWithPassword(input.username, input.password);
        ctx.res.cookie(ADMIN_SESSION_COOKIE, result.token, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 1000 * 60 * 60 * 12 });
        return result.user;
      } catch (error) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: error instanceof Error ? error.message : "Não foi possível entrar." });
      }
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const adminToken = ctx.req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))?.slice(ADMIN_SESSION_COOKIE.length + 1);
      await logoutAdminSession(adminToken);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      if (adminToken) ctx.res.clearCookie(ADMIN_SESSION_COOKIE, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  club: router({
    plans: publicProcedure.query(() => getClubPlans()),
    plan: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(96) })).query(({ input }) => getClubPlanBySlug(input.slug).catch(mapClubError)),
    partners: publicProcedure.query(() => listClubPartners().catch(mapClubError)),
    raffles: publicProcedure.query(() => listOpenRaffles().catch(mapClubError)),
    requestSubscription: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(255), phone: z.string().trim().min(8).max(32), email: z.string().trim().email().max(320), planSlug: z.string().trim().min(1).max(96), paymentMethod: z.enum(["card", "pix"]) })).mutation(({ input }) => requestSubscription({ ...input, email: input.email.toLowerCase() }).catch(mapClubError)),
    login: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), phone: z.string().trim().min(8).max(32) })).mutation(async ({ input, ctx }) => {
      try {
        const result = await loginCustomer(input.email, input.phone);
        ctx.res.cookie(CUSTOMER_SESSION_COOKIE, result.token, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 1000 * 60 * 60 * 24 * 7 });
        return result.customer;
      } catch (error) { mapClubError(error); }
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await logoutCustomer(ctx.req);
      ctx.res.clearCookie(CUSTOMER_SESSION_COOKIE, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: -1 });
      return { success: true } as const;
    }),
    me: customerProcedure.query(({ ctx }) => getVipDashboard(ctx.customer.id).catch(mapClubError)),
    myRaffles: customerProcedure.query(({ ctx }) => getCustomerRaffles(ctx.customer.id).catch(mapClubError)),
    joinRaffle: customerProcedure.input(z.object({ raffleId: z.number().int().positive() })).mutation(({ input, ctx }) => joinRaffle(ctx.customer.id, input.raffleId).catch(mapClubError)),
    spin: customerProcedure.input(z.object({ idempotencyKey: z.string().trim().min(16).max(191) })).mutation(({ input, ctx }) => spinRoulette(ctx.customer.id, input.idempotencyKey).catch(mapClubError)),
    consume: staffProcedure.input(z.object({ clubMemberId: z.number().int().positive(), membershipCycleId: z.number().int().positive(), kind: z.enum(["cut", "beard", "eyebrow", "discount", "benefit"]), quantity: z.number().int().positive(), idempotencyKey: z.string().trim().min(16).max(191), appointmentId: z.number().int().positive().optional(), serviceId: z.number().int().positive().optional(), barberId: z.number().int().positive().optional(), note: z.string().max(500).optional() })).mutation(({ input }) => consumeBenefit(input).catch(mapClubError)),
  }),

  appointments: router({
    schedule: publicProcedure.input(z.object({ barberSlug: z.enum(["luan", "bruno", "kaua"]), appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).query(({ input }) => listOccupiedSlots(input.barberSlug, input.appointmentDate)),
    create: publicProcedure.input(appointmentInput).mutation(async ({ input }) => {
      try {
        const appointment = await createAppointment(input);
        return { id: appointment.id, appointmentDate: appointment.appointmentDate, startTime: appointment.startTime.slice(0, 5), endTime: appointment.endTime.slice(0, 5), totalDurationMinutes: appointment.totalDurationMinutes };
      } catch (error) {
        if (error instanceof AppointmentConflictError) throw new TRPCError({ code: "CONFLICT", message: error.message });
        if (error instanceof AppointmentValidationError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        console.error("[Appointments] Failed to create appointment:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível confirmar o agendamento agora." });
      }
    }),
    list: staffProcedure.query(({ ctx }) => listAdminAppointments(ctx.user)),
    updateStatus: staffProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["confirmed", "cancelled"]) })).mutation(({ input, ctx }) => recordAppointmentHistory(ctx.user, input.id, input.status)),
    reschedule: staffProcedure.input(z.object({ id: z.number().int().positive(), appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), startTime: z.string().regex(/^\d{2}:\d{2}$/) })).mutation(({ input, ctx }) => rescheduleAppointment(ctx.user, input.id, input)),
    createFromPanel: staffProcedure.input(appointmentInput).mutation(async ({ input, ctx }) => {
      if (ctx.user.role === "barber" && ctx.user.barberId && input.barberSlug !== (["luan", "bruno", "kaua"] as const)[ctx.user.barberId - 1]) throw new TRPCError({ code: "FORBIDDEN", message: "Você só pode criar atendimentos para sua agenda." });
      return createAppointment(input);
    }),
  }),

  admin: router({
    profile: staffProcedure.query(({ ctx }) => ({ id: ctx.user.id, name: ctx.user.name, role: ctx.user.role, barberId: ctx.user.barberId })),
    dashboard: staffProcedure.query(({ ctx }) => getAdminDashboard(ctx.user)),
    customers: staffProcedure.query(({ ctx }) => listAdminCustomers(ctx.user)),
    reports: reportProcedure.input(adminDateRange).query(({ input, ctx }) => getAdminReport(ctx.user, input.fromDate, input.toDate, input.barberSlug)),
    blocks: staffProcedure.query(({ ctx }) => listBlocks(ctx.user)),
    createBlock: staffProcedure.input(z.object({ barberId: z.number().int().positive(), kind: z.enum(["personal", "service"]), appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), startTime: z.string().regex(/^\d{2}:\d{2}$/), endTime: z.string().regex(/^\d{2}:\d{2}$/), note: z.string().max(500).optional(), serviceId: z.number().int().positive().optional(), customerId: z.number().int().positive().optional(), valueCents: z.number().int().min(0).optional() })).mutation(({ input, ctx }) => createBlock(ctx.user, input)),
    deleteBlock: staffProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => deleteBlock(ctx.user, input.id)),
    users: adminProcedure.query(({ ctx }) => listStaffUsers(ctx.user)),
    setPassword: adminProcedure.input(z.object({ userId: z.number().int().positive(), password: z.string().min(10) })).mutation(({ input, ctx }) => setUserPassword(ctx.user, input.userId, input.password)),
    accessCheck: staffProcedure.query(({ ctx }) => ({ canViewAll: ctx.user.role === "admin", canViewReports: ctx.user.role === "admin" || ctx.user.role === "barber", canManageUsers: ctx.user.role === "admin", canViewFinance: canViewFinance(ctx.user) })),
    clubReport: reportProcedure.query(() => getAdminClubReport().catch(mapClubError)),
  }),
});

export type AppRouter = typeof appRouter;
