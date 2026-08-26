import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CalendarDays, Check, Clock3, LayoutDashboard, Loader2, LockKeyhole, LogIn, Menu, Plus, ShieldAlert, Users, WalletCards, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";

const money = (cents: number | null | undefined) => cents == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const roleLabel: Record<string, string> = { admin: "Administrador", barber: "Barbeiro", barbearia: "Barbearia" };

type Tab = "dashboard" | "agenda" | "clientes" | "relatorios" | "bloqueios" | "usuarios";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({ onSuccess: async () => { setMessage(""); await utils.auth.me.invalidate(); } });
  const submit = (event: FormEvent) => { event.preventDefault(); setMessage(""); login.mutate({ username, password }); };
  return <main className="admin-login-page">
    <div className="admin-login-card">
      <p className="admin-eyebrow">STREET BARBER SHOP · ÁREA INTERNA</p>
      <h1>Acesso ao painel</h1>
      <p>Entre com seu usuário individual para acessar a agenda e os recursos liberados para o seu perfil.</p>
      <form onSubmit={submit} className="admin-login-form">
        <label>Usuário<Input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="seu.usuario" /></label>
        <label>Senha<Input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" type="password" placeholder="••••••••••" /></label>
        {login.error && <span className="admin-error">{login.error.message}</span>}
        {message && <span className="admin-success">{message}</span>}
        <Button type="submit" disabled={login.isPending}><LogIn size={16} /> {login.isPending ? "Entrando…" : "Entrar no painel"}</Button>
      </form>
      <a className="admin-back-link" href="/">Voltar para o site público</a>
    </div>
  </main>;
}

function Metric({ icon: Icon, label, value, tone = "" }: { icon: typeof CalendarDays; label: string; value: string | number; tone?: string }) {
  return <article className={`admin-metric-card ${tone}`}><Icon size={18} /><strong>{value}</strong><span>{label}</span></article>;
}

function DashboardTab({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const query = trpc.admin.dashboard.useQuery(undefined, { enabled: Boolean(user) });
  if (query.isLoading) return <div className="admin-empty"><Loader2 className="animate-spin" /> Carregando dashboard…</div>;
  if (query.isError) return <div className="admin-empty"><ShieldAlert /> Não foi possível carregar o dashboard.</div>;
  const data = query.data;
  return <>
    <header className="admin-heading"><div><p className="admin-eyebrow">VISÃO GERAL · {roleLabel[user.role] ?? user.role}</p><h1>Bom trabalho, {user.name?.split(" ")[0] ?? "equipe"}.</h1><p>Uma visão rápida da operação da Street Barber Shop.</p></div></header>
    <section className="admin-metrics" aria-label="Indicadores principais">
      <Metric icon={CalendarDays} label="Agendamentos" value={data?.metrics.appointments ?? 0} />
      <Metric icon={Check} label="Confirmados" value={data?.metrics.confirmed ?? 0} tone="admin-metric-gold" />
      {user.role !== "barbearia" && <Metric icon={WalletCards} label="Faturamento" value={money(data?.metrics.revenueCents)} tone="admin-metric-violet" />}
      <Metric icon={X} label="Cancelamentos" value={data?.metrics.cancelled ?? 0} tone="admin-metric-muted" />
    </section>
    <section className="admin-panel"><div className="admin-panel-head"><div><p className="admin-eyebrow">PRÓXIMOS ATENDIMENTOS</p><h2>Agenda em movimento</h2></div><span className="admin-live-note"><span /> Dados do banco</span></div><AppointmentTable rows={data?.upcoming ?? []} compact /></section>
  </>;
}

function AppointmentTable({ rows, compact = false, onConfirm, onCancel, onReschedule }: { rows: any[]; compact?: boolean; onConfirm?: (id: number) => void; onCancel?: (id: number) => void; onReschedule?: (id: number) => void }) {
  if (!rows.length) return <div className="admin-empty"><Clock3 size={20} /> Nenhum agendamento neste recorte.</div>;
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Cliente</th><th>Barbeiro</th><th>Data e horário</th><th>Valor</th><th>Status</th>{!compact && <th>Operação</th>}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.customerName}</strong><small>{row.customerPhone}<br />{row.customerEmail}</small></td><td>{row.barberName}<small>{row.barberSlug}</small></td><td><strong>{dateLabel(row.appointmentDate)}</strong><small>{row.startTime.slice(0, 5)} – {row.endTime.slice(0, 5)}</small></td><td>{money(row.totalPriceCents)}</td><td><span className={`admin-status admin-status-${row.status}`}>{row.status === "confirmed" ? "Confirmado" : row.status === "cancelled" ? "Cancelado" : "Pendente"}</span></td>{!compact && <td><div className="admin-row-actions">{row.status !== "confirmed" && <Button size="sm" onClick={() => onConfirm?.(row.id)}><Check size={13} /></Button>}{row.status !== "cancelled" && <Button size="sm" variant="outline" onClick={() => onCancel?.(row.id)}><X size={13} /></Button>}{row.status !== "cancelled" && <Button size="sm" variant="outline" onClick={() => onReschedule?.(row.id)}>Remarcar</Button>}</div></td>}</tr>)}</tbody></table></div>;
}

function AgendaTab() {
  const query = trpc.appointments.list.useQuery();
  const utils = trpc.useUtils();
  const update = trpc.appointments.updateStatus.useMutation({ onSuccess: () => utils.appointments.list.invalidate() });
  const reschedule = trpc.appointments.reschedule.useMutation({ onSuccess: () => utils.appointments.list.invalidate() });
  const create = trpc.appointments.createFromPanel.useMutation({ onSuccess: () => { utils.appointments.list.invalidate(); setForm((current) => ({ ...current, name: "", phone: "", email: "" })); } });
  const [form, setForm] = useState({ barberSlug: "luan" as "luan" | "bruno" | "kaua", name: "", phone: "", email: "", serviceSlugs: ["corte"], appointmentDate: new Date().toISOString().slice(0, 10), startTime: "09:00" });
  const rows = query.data ?? [];
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate(form); };
  const promptReschedule = (id: number) => { const appointmentDate = window.prompt("Nova data (AAAA-MM-DD):"); const startTime = window.prompt("Novo horário (HH:MM):"); if (appointmentDate && startTime) reschedule.mutate({ id, appointmentDate, startTime }); };
  return <><header className="admin-heading"><div><p className="admin-eyebrow">CALENDÁRIO ÚNICO</p><h1>Agenda da barbearia</h1><p>Os mesmos agendamentos ocupam os horários do site e do painel.</p></div></header><section className="admin-panel"><div className="admin-panel-head"><div><p className="admin-eyebrow">NOVO AGENDAMENTO</p><h2>Agendar pelo painel</h2></div></div><form className="admin-block-form" onSubmit={submit}><label>Barbeiro<select value={form.barberSlug} onChange={(event) => setForm({ ...form, barberSlug: event.target.value as "luan" | "bruno" | "kaua" })}><option value="luan">Luan</option><option value="bruno">Bruno</option><option value="kaua">Kauã</option></select></label><label>Serviço<select value={form.serviceSlugs[0]} onChange={(event) => setForm({ ...form, serviceSlugs: [event.target.value] })}><option value="corte">Corte</option><option value="barba">Barba</option><option value="sobrancelha">Sobrancelha</option><option value="limpeza-de-pele">Limpeza de pele</option><option value="bigode-e-cavanhaque">Bigode e cavanhaque</option></select></label><label>Data<Input type="date" value={form.appointmentDate} onChange={(event) => setForm({ ...form, appointmentDate: event.target.value })} /></label><label>Horário<Input type="time" step="1800" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label><label>Cliente<Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome completo" /></label><label>Telefone<Input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="(00) 00000-0000" /></label><label>E-mail<Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="cliente@email.com" /></label><Button type="submit" disabled={create.isPending}><Plus size={16} /> {create.isPending ? "Salvando…" : "Criar agendamento"}</Button></form>{create.error && <p className="admin-error admin-form-error">{create.error.message}</p>}</section><section className="admin-panel"><div className="admin-panel-head"><div><p className="admin-eyebrow">ATENDIMENTOS</p><h2>Agenda compartilhada</h2></div><span className="admin-live-note"><span /> Banco conectado</span></div>{query.isLoading ? <div className="admin-empty"><Loader2 className="animate-spin" /> Carregando agenda…</div> : <AppointmentTable rows={rows} onConfirm={(id) => update.mutate({ id, status: "confirmed" })} onCancel={(id) => update.mutate({ id, status: "cancelled" })} onReschedule={promptReschedule} />}</section><div className="admin-note"><strong>Operações seguras</strong><span>Confirmação e cancelamento registram histórico. O reagendamento mantém o registro anterior e valida conflitos antes de salvar.</span><div className="admin-actions">{rows[0] && rows[0].status !== "confirmed" && <Button size="sm" onClick={() => update.mutate({ id: rows[0].id, status: "confirmed" })}><Check size={14} /> Confirmar próximo</Button>}{rows[0] && rows[0].status !== "cancelled" && <Button size="sm" variant="outline" onClick={() => update.mutate({ id: rows[0].id, status: "cancelled" })}><X size={14} /> Cancelar próximo</Button>}</div></div></>;
}

function CustomersTab() {
  const query = trpc.admin.customers.useQuery();
  return <><header className="admin-heading"><div><p className="admin-eyebrow">RELACIONAMENTO</p><h1>Clientes</h1><p>Base integrada aos atendimentos realizados pela Street Barber Shop.</p></div></header><section className="admin-panel">{query.isLoading ? <div className="admin-empty"><Loader2 className="animate-spin" /> Carregando clientes…</div> : !query.data?.length ? <div className="admin-empty"><Users /> Nenhum cliente cadastrado ainda.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Cliente</th><th>Contato</th><th>Plano/status</th><th>Histórico de atendimentos</th></tr></thead><tbody>{query.data.map((customer) => <tr key={customer.id}><td><strong>{customer.name}</strong><small>Desde {new Date(customer.createdAt).toLocaleDateString("pt-BR")}</small></td><td>{customer.phone}<small>{customer.email}</small></td><td><strong>{customer.plan ?? "Sem plano"}</strong><small>{customer.status}</small></td><td><strong>{customer.appointmentCount} atendimentos</strong><small>Último: {customer.lastAppointment ? `${dateLabel(customer.lastAppointment.date)} · ${customer.lastAppointment.time}` : "—"}</small><small>Próximo: {customer.nextAppointment ? `${dateLabel(customer.nextAppointment.date)} · ${customer.nextAppointment.time}` : "—"}</small>{customer.appointments.map((appointment) => <small key={appointment.id}>{dateLabel(appointment.date)} · {appointment.time} · {appointment.barberName ?? "—"}<br />{appointment.services.join(", ")} · {appointment.status}</small>)}</td></tr>)}</tbody></table></div>}</section></>;
}

function ReportsTab({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(today.slice(0, 8) + "01");
  const [toDate, setToDate] = useState(today);
  const query = trpc.admin.reports.useQuery({ fromDate, toDate }, { enabled: user.role === "admin" || user.role === "barber" });
  return <><header className="admin-heading"><div><p className="admin-eyebrow">PERFORMANCE · {user.role === "barber" ? "SEU ESCOPO" : "CONSOLIDADO"}</p><h1>Relatórios</h1><p>{user.role === "barber" ? "Seus indicadores, sem acesso aos dados dos outros barbeiros." : "Faturamento e operação em uma visão comparável."}</p></div><div className="admin-date-filter"><Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><span>até</span><Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></div></header>{query.isLoading ? <div className="admin-empty"><Loader2 className="animate-spin" /> Calculando relatório…</div> : <><section className="admin-metrics"><Metric icon={WalletCards} label="Faturamento" value={money(query.data?.revenueCents)} tone="admin-metric-gold" /><Metric icon={CalendarDays} label="Atendimentos" value={query.data?.appointments ?? 0} /><Metric icon={WalletCards} label="Ticket médio" value={money(query.data?.averageTicketCents)} tone="admin-metric-violet" /><Metric icon={X} label="Cancelamentos" value={query.data?.cancellations ?? 0} tone="admin-metric-muted" /></section><section className="admin-panel"><div className="admin-panel-head"><div><p className="admin-eyebrow">DESEMPENHO POR BARBEIRO</p><h2>Comparativo do período</h2></div></div><div className="admin-report-grid">{query.data?.byBarber.map((barber) => <article className="admin-report-card" key={barber.barberName}><strong>{barber.barberName}</strong><span>{barber.appointments} atendimentos</span><b>{money(barber.revenueCents)}</b><small>{barber.cancellations} cancelamentos</small></article>)}</div></section></>}</>;
}

function BlocksTab({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const query = trpc.admin.blocks.useQuery();
  const customers = trpc.admin.customers.useQuery();
  const utils = trpc.useUtils();
  const create = trpc.admin.createBlock.useMutation({ onSuccess: () => { utils.admin.blocks.invalidate(); utils.appointments.list.invalidate(); } });
  const remove = trpc.admin.deleteBlock.useMutation({ onSuccess: () => utils.admin.blocks.invalidate() });
  const [form, setForm] = useState({ barberId: user.barberId ?? 1, kind: "personal" as "personal" | "service", appointmentDate: new Date().toISOString().slice(0, 10), startTime: "12:00", endTime: "13:00", note: "", serviceId: 1, customerId: 0, valueCents: 0 });
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate(form); };
  return <><header className="admin-heading"><div><p className="admin-eyebrow">DISPONIBILIDADE</p><h1>Bloqueios de horário</h1><p>Atividade pessoal não fatura. Bloqueio para atendimento deve virar agendamento real.</p></div></header><section className="admin-panel"><div className="admin-panel-head"><div><p className="admin-eyebrow">NOVO BLOQUEIO</p><h2>Bloquear horário</h2></div></div><form className="admin-block-form" onSubmit={submit}><label>Barbeiro<select value={form.barberId} onChange={(event) => setForm({ ...form, barberId: Number(event.target.value) })} disabled={user.role === "barber"}><option value={1}>Luan</option><option value={2}>Bruno</option><option value={3}>Kauã</option></select></label><label>Tipo<select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as "personal" | "service" })}><option value="personal">Atividade pessoal</option><option value="service">Bloqueio para atendimento</option></select></label><label>Data<Input type="date" value={form.appointmentDate} onChange={(event) => setForm({ ...form, appointmentDate: event.target.value })} /></label><label>Início<Input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label><label>Fim<Input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label><label>Observação<Input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Opcional" /></label>{form.kind === "service" && <><label>Cliente<select value={form.customerId} onChange={(event) => setForm({ ...form, customerId: Number(event.target.value) })}><option value={0}>Selecione um cliente</option>{customers.data?.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><label>Serviço<select value={form.serviceId} onChange={(event) => setForm({ ...form, serviceId: Number(event.target.value) })}><option value={1}>Corte</option><option value={2}>Barba</option><option value={3}>Sobrancelha</option><option value={4}>Limpeza de pele</option><option value={5}>Bigode e cavanhaque</option></select></label><label>Valor em centavos<Input type="number" min={0} value={form.valueCents} onChange={(event) => setForm({ ...form, valueCents: Number(event.target.value) })} /></label></>}<Button type="submit" disabled={create.isPending}><Plus size={16} /> {create.isPending ? "Salvando…" : "Bloquear horário"}</Button></form></section><section className="admin-panel"><div className="admin-panel-head"><div><p className="admin-eyebrow">BLOQUEIOS ATIVOS</p><h2>Horários indisponíveis</h2></div></div>{query.isLoading ? <div className="admin-empty"><Loader2 className="animate-spin" /> Carregando bloqueios…</div> : !query.data?.length ? <div className="admin-empty"><LockKeyhole /> Nenhum bloqueio ativo.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Barbeiro</th><th>Data</th><th>Horário</th><th>Tipo</th><th>Ação</th></tr></thead><tbody>{query.data.map((block) => <tr key={block.id}><td>{block.barberName}</td><td>{dateLabel(block.appointmentDate)}</td><td>{block.startTime.slice(0, 5)} – {block.endTime.slice(0, 5)}</td><td>{block.kind === "personal" ? "Pessoal" : "Atendimento"}</td><td><Button size="sm" variant="outline" onClick={() => remove.mutate({ id: block.id })}>Desbloquear</Button></td></tr>)}</tbody></table></div>}</section></>;
}

function UsersTab() {
  const query = trpc.admin.users.useQuery();
  const utils = trpc.useUtils();
  const setPassword = trpc.admin.setPassword.useMutation({ onSuccess: () => { utils.admin.users.invalidate(); setPasswordForm({ userId: 0, password: "" }); } });
  const [passwordForm, setPasswordForm] = useState({ userId: 0, password: "" });
  const submit = (event: FormEvent) => { event.preventDefault(); if (passwordForm.userId) setPassword.mutate(passwordForm); };
  return <><header className="admin-heading"><div><p className="admin-eyebrow">CONTROLE DE ACESSO</p><h1>Usuários</h1><p>Os quatro perfis fixos da operação. As senhas são armazenadas somente como hash seguro.</p></div></header><section className="admin-panel"><div className="admin-panel-head"><div><p className="admin-eyebrow">CREDENCIAL INDIVIDUAL</p><h2>Configurar senha</h2></div></div><form className="admin-block-form" onSubmit={submit}><label>Perfil<select required value={passwordForm.userId} onChange={(event) => setPasswordForm({ ...passwordForm, userId: Number(event.target.value) })}><option value={0}>Selecione um perfil</option>{query.data?.map((item) => <option key={item.id} value={item.id}>{item.name} · {roleLabel[item.role] ?? item.role}</option>)}</select></label><label>Nova senha<Input required type="password" minLength={10} value={passwordForm.password} onChange={(event) => setPasswordForm({ ...passwordForm, password: event.target.value })} /></label><Button type="submit" disabled={setPassword.isPending}><LockKeyhole size={16} /> {setPassword.isPending ? "Salvando…" : "Salvar senha"}</Button></form>{setPassword.error && <p className="admin-error admin-form-error">{setPassword.error.message}</p>}</section><section className="admin-panel"><div className="admin-panel-head"><div><p className="admin-eyebrow">PERFIS FIXOS</p><h2>Equipe autorizada</h2></div></div>{query.isLoading ? <div className="admin-empty"><Loader2 className="animate-spin" /> Carregando usuários…</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nome</th><th>Usuário</th><th>Perfil</th><th>Senha</th></tr></thead><tbody>{query.data?.map((item) => <tr key={item.id}><td><strong>{item.name ?? "—"}</strong><small>{item.email ?? "Perfil local"}</small></td><td>{item.username ?? "OAuth"}</td><td>{roleLabel[item.role] ?? item.role}</td><td>{item.passwordSetAt ? "Configurada" : "Pendente"}</td></tr>)}</tbody></table></div>}</section></>;
}

function AdminContent() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute<{ tab?: string }>("/admin/:tab?");
  const tab = (params?.tab as Tab | undefined) ?? "dashboard";
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    document.body.classList.toggle("admin-menu-open", menuOpen);
    return () => document.body.classList.remove("admin-menu-open");
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  const navigate = (path: string) => { setLocation(path); setMenuOpen(false); };
  if (loading) return <div className="admin-empty"><Loader2 className="animate-spin" /> Verificando acesso…</div>;
  if (!user) return <LoginPage />;
  if (!["admin", "barber", "barbearia"].includes(user.role)) return <div className="admin-denied"><ShieldAlert size={30} /><h1>Acesso restrito</h1><p>Seu perfil não possui acesso ao painel administrativo.</p><Button onClick={() => setLocation("/")}>Voltar para a Home</Button></div>;
  const canReports = user.role === "admin" || user.role === "barber";
  const items: Array<{ tab: Tab; label: string; icon: typeof LayoutDashboard; visible: boolean }> = [
    { tab: "dashboard", label: "Dashboard", icon: LayoutDashboard, visible: true },
    { tab: "agenda", label: "Agenda", icon: CalendarDays, visible: true },
    { tab: "clientes", label: "Clientes", icon: Users, visible: true },
    { tab: "bloqueios", label: "Bloqueios", icon: LockKeyhole, visible: true },
    { tab: "relatorios", label: "Relatórios", icon: WalletCards, visible: canReports },
    { tab: "usuarios", label: "Usuários", icon: LockKeyhole, visible: user.role === "admin" },
  ];
  return <div className="admin-shell"><button className={`admin-sidebar-backdrop ${menuOpen ? "is-visible" : ""}`} aria-label="Fechar menu ao tocar fora" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1} /><div className="admin-mobile-toolbar"><div className="admin-brand"><span className="admin-brand-mark">S</span><div><strong>STREET</strong><small>BARBER SHOP</small></div></div><button className="admin-menu-trigger" aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen(true)}><Menu size={18} /> Menu</button></div><aside id="admin-navigation" className={`admin-sidebar ${menuOpen ? "is-open" : ""}`}><div className="admin-brand"><span className="admin-brand-mark">S</span><div><strong>STREET</strong><small>BARBER SHOP</small></div><button className="admin-menu-close" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><X size={18} /></button></div><nav>{items.filter((item) => item.visible).map((item) => <button key={item.tab} className={tab === item.tab ? "active" : ""} onClick={() => navigate(`/admin/${item.tab}`)}><item.icon size={17} /> {item.label}</button>)}</nav><div className="admin-sidebar-foot"><span>{roleLabel[user.role]}</span><small>{user.name ?? user.email ?? user.username ?? "Usuário"}</small></div></aside><main className="admin-main">{tab === "dashboard" && <DashboardTab user={user} />}{tab === "agenda" && <AgendaTab />}{tab === "clientes" && <CustomersTab />}{tab === "relatorios" && canReports && <ReportsTab user={user} />}{tab === "bloqueios" && <BlocksTab user={user} />}{tab === "usuarios" && user.role === "admin" && <UsersTab />}<button className="admin-public-link" onClick={() => navigate("/")}>← Ver site público</button></main></div>;
}

export default function AdminPage() {
  return <AdminContent />;
}
