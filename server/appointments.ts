import { and, desc, eq, gt, gte, lt, lte, ne, or } from "drizzle-orm";
import {
  appointments,
  appointmentServices,
  availability,
  barbers,
  barberServices,
  customers,
  services,
  type Appointment,
} from "../drizzle/schema";
import { catalogBarbers, getCatalogBarber, operatingHours } from "../shared/catalog";
import { getDb } from "./db";

export type CreateAppointmentInput = {
  barberSlug: string;
  name: string;
  phone: string;
  email: string;
  serviceSlugs: string[];
  appointmentDate: string;
  startTime: string;
};

export type ValidatedAppointment = {
  barberSlug: string;
  name: string;
  phone: string;
  email: string;
  serviceSlugs: string[];
  appointmentDate: string;
  startTime: string;
  endTime: string;
  totalDurationMinutes: number;
  totalPriceCents: number;
};

export class AppointmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppointmentValidationError";
  }
}

export class AppointmentConflictError extends Error {
  constructor(message = "Este horário acabou de ser reservado. Escolha outro horário.") {
    super(message);
    this.name = "AppointmentConflictError";
  }
}

export const intervalsOverlap = (startA: string, endA: string, startB: string, endB: string) => {
  const startAMinutes = timeToMinutes(startA)
  const endAMinutes = timeToMinutes(endA)
  const startBMinutes = timeToMinutes(startB)
  const endBMinutes = timeToMinutes(endB)
  if ([startAMinutes, endAMinutes, startBMinutes, endBMinutes].some((value) => value === null)) return false
  return startAMinutes! < endBMinutes! && endAMinutes! > startBMinutes!
}

const timeToMinutes = (value: string) => {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const minutesToTime = (value: number) => {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
};

const isValidDateValue = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const weekdayForDate = (value: string) => new Date(`${value}T12:00:00-03:00`).getUTCDay();

export const toUtcTimestamp = (date: string, time: string) => new Date(`${date}T${time.slice(0, 5)}:00-03:00`).getTime();

export function validateAppointmentRequest(input: CreateAppointmentInput): ValidatedAppointment {
  const barber = getCatalogBarber(input.barberSlug);
  if (!barber) throw new AppointmentValidationError("Barbeiro não encontrado.");

  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) throw new AppointmentValidationError("Informe seu nome completo.");
  if (phone.replace(/\D/g, "").length < 8) throw new AppointmentValidationError("Informe um telefone válido.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new AppointmentValidationError("Informe um e-mail válido.");
  if (!input.serviceSlugs.length) throw new AppointmentValidationError("Selecione ao menos um serviço.");
  if (new Set(input.serviceSlugs).size !== input.serviceSlugs.length) {
    throw new AppointmentValidationError("Não repita serviços no mesmo agendamento.");
  }
  if (!isValidDateValue(input.appointmentDate)) throw new AppointmentValidationError("Escolha uma data válida.");
  if (!operatingHours.workingDays.includes(weekdayForDate(input.appointmentDate) as (typeof operatingHours.workingDays)[number])) {
    throw new AppointmentValidationError("A barbearia atende de terça a sábado.");
  }

  const selectedServices = input.serviceSlugs.map((slug) => barber.services.find((service) => service.slug === slug));
  if (selectedServices.some((service) => !service)) {
    throw new AppointmentValidationError("Um dos serviços selecionados não está disponível para este barbeiro.");
  }

  const totalDurationMinutes = selectedServices.reduce((total, service) => total + (service?.durationMinutes ?? 0), 0);
  const totalPriceCents = selectedServices.reduce((total, service) => total + (service?.priceCents ?? 0), 0);
  const startMinutes = timeToMinutes(input.startTime);
  if (startMinutes === null || startMinutes % 30 !== 0) {
    throw new AppointmentValidationError("Escolha um horário válido da agenda.");
  }
  const openMinutes = timeToMinutes(operatingHours.open);
  const closeMinutes = timeToMinutes(operatingHours.close);
  if (openMinutes === null || closeMinutes === null || startMinutes < openMinutes || startMinutes >= closeMinutes) {
    throw new AppointmentValidationError("Escolha um horário dentro do atendimento, das 09h às 20h.");
  }
  const endMinutes = startMinutes + totalDurationMinutes;
  if (endMinutes > closeMinutes) {
    throw new AppointmentValidationError("Esse atendimento ultrapassa o horário de encerramento.");
  }

  return {
    barberSlug: barber.slug,
    name,
    phone,
    email,
    serviceSlugs: input.serviceSlugs,
    appointmentDate: input.appointmentDate,
    startTime: `${input.startTime}:00`,
    endTime: minutesToTime(endMinutes),
    totalDurationMinutes,
    totalPriceCents,
  };
}

export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  const validated = validateAppointmentRequest(input);
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  return db.transaction(async (tx) => {
    const barber = await tx.select().from(barbers).where(eq(barbers.slug, validated.barberSlug)).limit(1);
    if (!barber[0]) throw new AppointmentValidationError("Barbeiro não encontrado no catálogo.");

    const selectedServices = await tx
      .select({
        id: services.id,
        slug: services.slug,
        priceCents: barberServices.priceCents,
        durationMinutes: barberServices.durationMinutes,
      })
      .from(barberServices)
      .innerJoin(services, eq(services.id, barberServices.serviceId))
      .where(and(eq(barberServices.barberId, barber[0].id), or(...validated.serviceSlugs.map((slug) => eq(services.slug, slug)))));

    if (selectedServices.length !== validated.serviceSlugs.length) {
      throw new AppointmentValidationError("Os serviços selecionados não estão disponíveis para este barbeiro.");
    }

    const conflicts = await tx
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.barberId, barber[0].id),
          eq(appointments.appointmentDate, validated.appointmentDate),
          ne(appointments.status, "cancelled"),
          lt(appointments.startTime, validated.endTime),
          gt(appointments.endTime, validated.startTime),
        ),
      )
      .limit(1);
    if (conflicts[0]) throw new AppointmentConflictError();

    const [availabilityRow] = await tx
      .select({ id: availability.id })
      .from(availability)
      .where(
        and(
          eq(availability.barberId, barber[0].id),
          eq(availability.weekday, weekdayForDate(validated.appointmentDate)),
          eq(availability.active, 1),
          lte(availability.startTime, validated.startTime),
          gte(availability.endTime, validated.endTime),
        ),
      )
      .limit(1);
    if (!availabilityRow) throw new AppointmentValidationError("Esse horário não está dentro da disponibilidade do barbeiro.");

    const [existingCustomer] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.phone, validated.phone), eq(customers.email, validated.email)))
      .limit(1);
    let customerId = existingCustomer?.id;
    if (!customerId) {
      const customerInsert = await tx.insert(customers).values({
        name: validated.name,
        phone: validated.phone,
        email: validated.email,
      });
      customerId = Number(customerInsert[0].insertId);
    } else {
      await tx.update(customers).set({ name: validated.name, updatedAt: new Date() }).where(eq(customers.id, customerId));
    }

    const appointmentInsert = await tx.insert(appointments).values({
      customerId,
      barberId: barber[0].id,
      appointmentDate: validated.appointmentDate,
      startTime: validated.startTime,
      endTime: validated.endTime,
      scheduledStartUtcMs: toUtcTimestamp(validated.appointmentDate, validated.startTime),
      scheduledEndUtcMs: toUtcTimestamp(validated.appointmentDate, validated.endTime),
      totalDurationMinutes: validated.totalDurationMinutes,
      totalPriceCents: validated.totalPriceCents,
      status: "confirmed",
    });
    const appointmentId = Number(appointmentInsert[0].insertId);
    await tx.insert(appointmentServices).values(selectedServices.map((service) => ({ appointmentId, serviceId: service.id, priceCents: service.priceCents, durationMinutes: service.durationMinutes })));
    const [appointment] = await tx.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
    if (!appointment) throw new Error("Não foi possível recuperar o agendamento criado.");

    return appointment;
  });
}

export async function listAppointments() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
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
    })
    .from(appointments)
    .innerJoin(customers, eq(customers.id, appointments.customerId))
    .innerJoin(barbers, eq(barbers.id, appointments.barberId))
    .orderBy(desc(appointments.appointmentDate), desc(appointments.startTime))
    .limit(200);
}

export async function updateAppointmentStatus(id: number, status: "pending" | "confirmed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(appointments).set({ status, updatedAt: new Date() }).where(eq(appointments.id, id));
  const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return appointment;
}

export const supportedBarberSlugs = catalogBarbers.map((barber) => barber.slug);
