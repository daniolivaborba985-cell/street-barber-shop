export type CatalogService = {
  slug: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
};

export type CatalogBarber = {
  slug: string;
  name: string;
  assistant: string;
  phone: string;
  instagram: string;
  services: CatalogService[];
};

export const catalogBarbers: CatalogBarber[] = [
  {
    slug: "luan",
    name: "Luan Bringhenti",
    assistant: "Lucas",
    phone: "49991570099",
    instagram: "@luan_barbeer",
    services: [
      { slug: "corte", name: "Corte", priceCents: 3500, durationMinutes: 25 },
      { slug: "barba", name: "Barba", priceCents: 2500, durationMinutes: 20 },
      { slug: "sobrancelha", name: "Sobrancelha", priceCents: 1000, durationMinutes: 10 },
      { slug: "limpeza-de-pele", name: "Limpeza de pele", priceCents: 1500, durationMinutes: 15 },
      { slug: "bigode-e-cavanhaque", name: "Bigode e cavanhaque", priceCents: 1000, durationMinutes: 15 },
    ],
  },
  {
    slug: "bruno",
    name: "Bruno Bringhenti",
    assistant: "Bryan",
    phone: "54999604418",
    instagram: "@bruninho_barbeer",
    services: [
      { slug: "corte", name: "Corte", priceCents: 3000, durationMinutes: 30 },
      { slug: "barba", name: "Barba", priceCents: 2000, durationMinutes: 30 },
      { slug: "sobrancelha", name: "Sobrancelha", priceCents: 1000, durationMinutes: 10 },
      { slug: "limpeza-de-pele", name: "Limpeza de pele", priceCents: 1500, durationMinutes: 15 },
      { slug: "bigode-e-cavanhaque", name: "Bigode e cavanhaque", priceCents: 1000, durationMinutes: 15 },
    ],
  },
  {
    slug: "kaua",
    name: "Kauã dos Santos",
    assistant: "Noah",
    phone: "549996290897",
    instagram: "@kaua_barbeer",
    services: [
      { slug: "corte", name: "Corte", priceCents: 3000, durationMinutes: 30 },
      { slug: "barba", name: "Barba", priceCents: 3000, durationMinutes: 30 },
      { slug: "sobrancelha", name: "Sobrancelha", priceCents: 1000, durationMinutes: 10 },
      { slug: "limpeza-de-pele", name: "Limpeza de pele", priceCents: 1500, durationMinutes: 15 },
      { slug: "bigode-e-cavanhaque", name: "Bigode e cavanhaque", priceCents: 1000, durationMinutes: 15 },
    ],
  },
];

export const operatingHours = {
  timezone: "America/Sao_Paulo",
  open: "09:00",
  close: "20:00",
  workingDays: [2, 3, 4, 5, 6],
} as const;

export const appointmentStatuses = ["pending", "confirmed", "cancelled"] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const getCatalogBarber = (slug: string) => catalogBarbers.find((barber) => barber.slug === slug);

export const getCatalogService = (barberSlug: string, serviceSlug: string) =>
  getCatalogBarber(barberSlug)?.services.find((service) => service.slug === serviceSlug);
