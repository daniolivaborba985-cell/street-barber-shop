import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import {
  AppointmentConflictError,
  AppointmentValidationError,
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
} from "./appointments";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const appointmentInput = z.object({
  barberSlug: z.enum(["luan", "bruno", "kaua"]),
  name: z.string().trim().min(2).max(255),
  phone: z.string().trim().min(8).max(32),
  email: z.string().trim().email().max(320),
  serviceSlugs: z.array(z.string().trim().min(1)).min(1).max(5),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  appointments: router({
    create: publicProcedure.input(appointmentInput).mutation(async ({ input }) => {
      try {
        const appointment = await createAppointment(input);
        return {
          id: appointment.id,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime.slice(0, 5),
          endTime: appointment.endTime.slice(0, 5),
          totalDurationMinutes: appointment.totalDurationMinutes,
        };
      } catch (error) {
        if (error instanceof AppointmentConflictError) {
          throw new TRPCError({ code: "CONFLICT", message: error.message });
        }
        if (error instanceof AppointmentValidationError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        console.error("[Appointments] Failed to create appointment:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível confirmar o agendamento agora." });
      }
    }),

    list: adminProcedure.query(async () => listAppointments()),

    updateStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["pending", "confirmed", "cancelled"]) }))
      .mutation(async ({ input }) => updateAppointmentStatus(input.id, input.status)),
  }),
});

export type AppRouter = typeof appRouter;
