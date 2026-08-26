import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CalendarDays, Check, Clock3, Loader2, Scissors, ShieldAlert, X } from "lucide-react";
import { useLocation } from "wouter";

const formatDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatMoney = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

function StatusBadge({ status }: { status: string }) {
  const label = status === "confirmed" ? "Confirmado" : status === "cancelled" ? "Cancelado" : "Pendente";
  return <span className={`admin-status admin-status-${status}`}>{label}</span>;
}

function AdminContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin";
  const appointments = trpc.appointments.list.useQuery(undefined, { enabled: isAdmin });
  const updateStatus = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => appointments.refetch(),
  });

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <ShieldAlert size={30} />
        <h1>Acesso administrativo restrito</h1>
        <p>Esta área está disponível apenas para usuários autorizados da Street Barber Shop.</p>
        <Button onClick={() => setLocation("/")}>Voltar para a Home</Button>
      </div>
    );
  }

  const rows = appointments.data ?? [];
  const confirmedCount = rows.filter((appointment) => appointment.status === "confirmed").length;
  const pendingCount = rows.filter((appointment) => appointment.status === "pending").length;

  return (
    <div className="admin-screen">
      <header className="admin-heading">
        <div>
          <p className="admin-eyebrow">STREET BARBER SHOP · ADMINISTRAÇÃO</p>
          <h1>Agenda da barbearia</h1>
          <p>Visualize e organize os agendamentos registrados pelos assistentes.</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/")}>Ver site público</Button>
      </header>

      <section className="admin-metrics" aria-label="Resumo da agenda">
        <article><CalendarDays size={18} /><strong>{rows.length}</strong><span>Total de registros</span></article>
        <article><Check size={18} /><strong>{confirmedCount}</strong><span>Confirmados</span></article>
        <article><Clock3 size={18} /><strong>{pendingCount}</strong><span>Pendentes</span></article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div><p className="admin-eyebrow">REGISTROS RECENTES</p><h2>Agendamentos</h2></div>
          <span className="admin-live-note"><span /> Banco de dados conectado</span>
        </div>
        {appointments.isLoading ? (
          <div className="admin-empty"><Loader2 className="animate-spin" size={22} /><span>Carregando agenda…</span></div>
        ) : appointments.isError ? (
          <div className="admin-empty"><ShieldAlert size={22} /><span>Não foi possível carregar os agendamentos agora.</span></div>
        ) : rows.length === 0 ? (
          <div className="admin-empty"><Scissors size={22} /><span>Nenhum agendamento registrado ainda.</span></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Cliente</th><th>Barbeiro</th><th>Data e horário</th><th>Duração</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>{rows.map((appointment) => <tr key={appointment.id}>
                <td><strong>{appointment.customerName}</strong><small>{appointment.customerPhone}<br />{appointment.customerEmail}</small></td>
                <td>{appointment.barberName}<small>Assistente {appointment.barberSlug === "luan" ? "Lucas" : appointment.barberSlug === "bruno" ? "Bryan" : "Noah"}</small></td>
                <td><strong>{formatDate(appointment.appointmentDate)}</strong><small>{appointment.startTime.slice(0, 5)} – {appointment.endTime.slice(0, 5)}</small></td>
                <td>{appointment.totalDurationMinutes} min</td>
                <td>{formatMoney(appointment.totalPriceCents)}</td>
                <td><StatusBadge status={appointment.status} /></td>
                <td><div className="admin-actions">
                  {appointment.status !== "confirmed" && <Button size="sm" onClick={() => updateStatus.mutate({ id: appointment.id, status: "confirmed" })} disabled={updateStatus.isPending}><Check size={14} /> Confirmar</Button>}
                  {appointment.status !== "cancelled" && <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: appointment.id, status: "cancelled" })} disabled={updateStatus.isPending}><X size={14} /> Cancelar</Button>}
                </div></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminPage() {
  return <DashboardLayout><AdminContent /></DashboardLayout>;
}
