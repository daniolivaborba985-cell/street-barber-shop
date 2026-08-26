import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Clock3, LockKeyhole, Plus } from "lucide-react";
import { useMemo, useState } from "react";

const BARBERS = [
  { id: 1, slug: "luan", name: "Luan" },
  { id: 2, slug: "bruno", name: "Bruno" },
  { id: 3, slug: "kaua", name: "Kauã" },
] as const;

type BarberSlug = (typeof BARBERS)[number]["slug"];
type User = { role: string; barberId: number | null };
type AppointmentRow = { appointmentDate: string; status: string; barberId: number; barberSlug: string; barberName: string; startTime: string; endTime: string; customerName: string };
type BlockRow = { appointmentDate: string; active: boolean; kind: string; barberId: number; barberName: string; startTime: string; endTime: string; note?: string | null };

const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const readableDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
const monthLabel = (date: Date) => date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export function AgendaCalendar({ user, rows, selectedBarber, onBarberChange }: { user: User; rows: AppointmentRow[]; selectedBarber: BarberSlug | "all"; onBarberChange: (value: BarberSlug | "all") => void }) {
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(Math.max(now.getFullYear(), 2026), now.getFullYear() < 2026 ? 0 : now.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState(() => isoDate(new Date()));
  const [showBlockForm, setShowBlockForm] = useState(false);
  const blocks = trpc.admin.blocks.useQuery();
  const customers = trpc.admin.customers.useQuery(undefined, { enabled: showBlockForm && user.role !== "barber" });
  const utils = trpc.useUtils();
  const createBlock = trpc.admin.createBlock.useMutation({ onSuccess: async () => { setShowBlockForm(false); await Promise.all([utils.admin.blocks.invalidate(), utils.appointments.list.invalidate()]); } });
  const [form, setForm] = useState({ barberId: user.barberId ?? 1, kind: "personal" as "personal" | "service", appointmentDate: isoDate(new Date()), startTime: "12:00", endTime: "13:00", note: "", serviceId: 1, customerId: 0, valueCents: 0 });
  const visibleBarbers = user.role === "barber" ? BARBERS.filter((barber) => barber.id === user.barberId) : BARBERS;
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridDays = useMemo(() => Array.from({ length: 42 }, (_, index) => new Date(monthStart.getFullYear(), monthStart.getMonth(), index - monthStart.getDay() + 1)), [monthStart.getFullYear(), monthStart.getMonth()]);
  const filteredRows = useMemo(() => selectedBarber === "all" ? rows : rows.filter((row) => row.barberSlug === selectedBarber), [rows, selectedBarber]);
  const filteredBlocks = useMemo(() => (blocks.data ?? []).filter((block) => block.active && (selectedBarber === "all" || block.barberId === BARBERS.find((barber) => barber.slug === selectedBarber)?.id)), [blocks.data, selectedBarber]);
  const selectedRows = filteredRows.filter((row) => row.appointmentDate === selectedDate && row.status !== "cancelled");
  const selectedBlocks = filteredBlocks.filter((block) => block.appointmentDate === selectedDate);
  const statusFor = (date: string) => {
    const hasConfirmed = filteredRows.some((row) => row.appointmentDate === date && row.status === "confirmed");
    const hasBlock = filteredBlocks.some((block) => block.appointmentDate === date);
    return hasConfirmed && hasBlock ? "mixed" : hasConfirmed ? "confirmed" : hasBlock ? "blocked" : "";
  };
  const moveMonth = (offset: number) => setMonth((current) => { const next = new Date(current.getFullYear(), current.getMonth() + offset, 1); setSelectedDate(isoDate(next)); return next; });
  const submitBlock = (event: React.FormEvent) => { event.preventDefault(); createBlock.mutate(form); };
  const selectedLabel = BARBERS.find((barber) => barber.slug === selectedBarber)?.name ?? "Todos os barbeiros";

  return <section className="admin-calendar-stack">
    <section className="admin-panel admin-calendar-panel">
      <div className="admin-panel-head admin-calendar-head"><div><p className="admin-eyebrow">AGENDA COMPARTILHADA</p><h2>Calendário de {selectedLabel}</h2><p>Clique em um dia para abrir os atendimentos e bloqueios.</p></div><label className="admin-filter-label">Visualizar agenda<select aria-label="Escolher barbeiro" value={selectedBarber} onChange={(event) => onBarberChange(event.target.value as BarberSlug | "all")} disabled={user.role === "barber"}><option value="all">Todos os barbeiros</option>{visibleBarbers.map((barber) => <option key={barber.slug} value={barber.slug}>{barber.name}</option>)}</select></label></div>
      <div className="admin-calendar-toolbar"><Button variant="outline" size="sm" onClick={() => moveMonth(-1)} disabled={month.getFullYear() === 2026 && month.getMonth() === 0} aria-label="Mês anterior"><ChevronLeft size={16} /></Button><strong>{monthLabel(month)}</strong><Button variant="outline" size="sm" onClick={() => moveMonth(1)} aria-label="Próximo mês"><ChevronRight size={16} /></Button></div>
      <div className="admin-calendar-weekdays" aria-hidden="true">{["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
      <div className="admin-calendar-grid" role="grid" aria-label={`Calendário de ${monthLabel(month)}`}>{gridDays.map((date) => { const dateValue = isoDate(date); const outside = date.getMonth() !== month.getMonth(); const status = statusFor(dateValue); const isSelected = dateValue === selectedDate; return <button key={dateValue} type="button" role="gridcell" className={`admin-calendar-day ${outside ? "is-outside" : ""} ${status ? `has-${status}` : ""} ${isSelected ? "is-selected" : ""}`} onClick={() => !outside && setSelectedDate(dateValue)} aria-label={`${date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}${status === "confirmed" ? ", agendamento confirmado" : status === "blocked" ? ", bloqueio" : status === "mixed" ? ", agendamento confirmado e bloqueio" : ", sem marcações"}`}><span>{date.getDate()}</span>{status && <i aria-hidden="true" />}</button>; })}</div>
      <div className="admin-calendar-legend"><span><i className="legend-dot legend-normal" /> Livre</span><span><i className="legend-dot legend-blocked" /> Bloqueio</span><span><i className="legend-dot legend-confirmed" /> Confirmado</span><span><i className="legend-dot legend-mixed" /> Ambos</span></div>
    </section>
    <section className="admin-panel admin-day-panel"><div className="admin-panel-head"><div><p className="admin-eyebrow">DIA SELECIONADO</p><h2>{readableDate(selectedDate)}</h2><p>{selectedLabel} · {selectedRows.length + selectedBlocks.length} marcações</p></div><Button onClick={() => { setForm((current) => ({ ...current, appointmentDate: selectedDate, barberId: selectedBarber === "all" ? current.barberId : BARBERS.find((barber) => barber.slug === selectedBarber)?.id ?? current.barberId })); setShowBlockForm((value) => !value); }}><Plus size={16} /> {showBlockForm ? "Fechar bloqueio" : "Novo bloqueio"}</Button></div>{showBlockForm && <form className="admin-block-form admin-agenda-block-form" onSubmit={submitBlock}><label>Barbeiro<select value={form.barberId} onChange={(event) => setForm({ ...form, barberId: Number(event.target.value) })} disabled={user.role === "barber"}><option value={1}>Luan</option><option value={2}>Bruno</option><option value={3}>Kauã</option></select></label><label>Tipo<select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as "personal" | "service" })}><option value="personal">Bloqueio pessoal</option><option value="service">Bloqueio para atendimento</option></select></label><label>Início<Input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label><label>Fim<Input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label><label className="admin-field-wide">Observação<Input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Opcional" /></label>{form.kind === "service" && <><label>Cliente<select required value={form.customerId} onChange={(event) => setForm({ ...form, customerId: Number(event.target.value) })}><option value={0}>Selecione um cliente</option>{customers.data?.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><label>Serviço<select value={form.serviceId} onChange={(event) => setForm({ ...form, serviceId: Number(event.target.value) })}><option value={1}>Corte</option><option value={2}>Barba</option><option value={3}>Sobrancelha</option><option value={4}>Limpeza de pele</option><option value={5}>Bigode e cavanhaque</option></select></label><label>Valor em centavos<Input type="number" min={0} value={form.valueCents} onChange={(event) => setForm({ ...form, valueCents: Number(event.target.value) })} /></label></>}<Button type="submit" disabled={createBlock.isPending}><LockKeyhole size={15} /> {createBlock.isPending ? "Salvando…" : "Salvar bloqueio"}</Button></form>}{!selectedRows.length && !selectedBlocks.length ? <div className="admin-empty"><Clock3 size={20} /> Nenhuma marcação neste dia.</div> : <div className="admin-day-list">{selectedRows.map((row) => <article className="admin-day-item admin-day-confirmed" key={`appointment-${row.appointmentDate}-${row.startTime}-${row.customerName}`}><span className="admin-day-marker" /><div><strong>{row.startTime.slice(0, 5)} – {row.endTime.slice(0, 5)} · {row.customerName}</strong><small>{row.barberName} · Agendamento confirmado</small></div></article>)}{selectedBlocks.map((block) => <article className="admin-day-item admin-day-blocked" key={`block-${block.appointmentDate}-${block.startTime}-${block.barberId}`}><span className="admin-day-marker" /><div><strong>{block.startTime.slice(0, 5)} – {block.endTime.slice(0, 5)} · {block.barberName}</strong><small>{block.kind === "personal" ? "Bloqueio pessoal" : "Bloqueio para atendimento"}{block.note ? ` · ${block.note}` : ""}</small></div></article>)}</div>}</section>
  </section>;
}
