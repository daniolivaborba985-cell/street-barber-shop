// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserRound,
  Clock3,
  Crown,
  Droplets,
  MapPin,
  MessageCircle,
  Menu,
  Scissors,
  Slice,
  Smile,
  Sparkles,
  VenetianMask,
  X,
} from 'lucide-react'
import './street-barber.css'
import { trpc } from './lib/trpc'

const barbers = [
  {
    slug: 'luan', name: 'Luan Bringhenti', assistant: 'Lucas', phone: '49991570099', display: '(49) 99157-0099', instagram: '@luan_barbeer', photo: '/manus-storage/kaua_ae2b8882.jpeg', description: 'Atendimento cuidadoso, conversa leve e precisão em cada detalhe.', chatbot: '/assistentes/luan', identity: { label: 'PRECISÃO CLÁSSICA', signature: 'Corte limpo · presença certa', accent: '#d7b27e', soft: '#3b3025', avatar: '/manus-storage/lucas_8a22a8ee.png' },
    services: [
      { name: 'Corte', price: 'R$ 35', duration: 25 }, { name: 'Barba', price: 'R$ 25', duration: 20 }, { name: 'Sobrancelha', price: 'R$ 10', duration: 10 }, { name: 'Limpeza de pele', price: 'R$ 15', duration: 15 }, { name: 'Bigode e cavanhaque', price: 'R$ 10', duration: 15 },
    ],
  },
  {
    slug: 'bruno', name: 'Bruno Bringhenti', assistant: 'Bryan', phone: '54999604418', display: '(54) 99960-4418', instagram: '@bruninho_barbeer', photo: '/manus-storage/bruno_34a0c1b4.jpeg', description: 'Seu estilo, sua identidade e um atendimento pensado para você.', chatbot: '/assistentes/bruno', identity: { label: 'ATITUDE EM MOVIMENTO', signature: 'Ritmo de rua · acabamento forte', accent: '#ef6a52', soft: '#452822', avatar: '/manus-storage/bryan_7fc555c2.png' },
    services: [
      { name: 'Corte', price: 'R$ 30', duration: 30 }, { name: 'Barba', price: 'R$ 20', duration: 30 }, { name: 'Sobrancelha', price: 'R$ 10', duration: 10 }, { name: 'Limpeza de pele', price: 'R$ 15', duration: 15 }, { name: 'Bigode e cavanhaque', price: 'R$ 10', duration: 15 },
    ],
  },
  {
    slug: 'kaua', name: 'Kauã dos Santos', assistant: 'Noah', phone: '549996290897', display: '(54) 99962-90897', instagram: '@kaua_barbeer', photo: '/manus-storage/luan_e357146c.jpeg', description: 'Técnica, personalidade e acabamento para sair se sentindo bem.', chatbot: '/assistentes/kaua', identity: { label: 'DETALHE AUTORAL', signature: 'Traço preciso · identidade própria', accent: '#a8bd78', soft: '#303a27', avatar: '/manus-storage/noah_77a56205.png' },
    services: [
      { name: 'Corte', price: 'R$ 30', duration: 30 }, { name: 'Barba', price: 'R$ 30', duration: 30 }, { name: 'Sobrancelha', price: 'R$ 10', duration: 10 }, { name: 'Limpeza de pele', price: 'R$ 15', duration: 15 }, { name: 'Bigode e cavanhaque', price: 'R$ 10', duration: 15 },
    ],
  },
]

const BeardReferenceIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
    <path d="M8 19c4-1 7-4 10-7 3 3 6 4 10 0 3 3 6 6 12 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 22c1 10 5 17 13 22 8-5 12-12 13-22-4 3-8 4-13 1-5 3-9 2-13-1Z" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 27c2 2 4 3 6 3s4-1 6-3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

const BrowReferenceIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
    <path d="M7 27c5-8 12-11 19-8 3 1 6 1 9-1 2-1 4-1 6 0" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 35c5-3 10-4 15-2 3 1 6 1 9-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".72" />
  </svg>
)

const MustacheReferenceIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
    <path d="M24 21c-4-6-9-7-14-3-3 2-5 2-7 1 2 7 7 11 14 9 3-1 5-3 7-5 2 2 4 4 7 5 7 2 12-2 14-9-2 1-4 1-7-1-5-4-10-3-14 3Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 22v7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M18 34c2 3 4 4 6 4s4-1 6-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

const serviceIcons = [Scissors, BeardReferenceIcon, BrowReferenceIcon, Droplets, MustacheReferenceIcon]
const services = [
  { number: '01', name: 'Corte', detail: 'Luan R$ 35 · Bruno e Kauã R$ 30', description: 'Acabamento preciso e leitura do seu estilo.' },
  { number: '02', name: 'Barba', detail: 'Luan R$ 25 · Bruno e Kauã R$ 20', description: 'Desenho, volume e finalização na medida.' },
  { number: '03', name: 'Sobrancelha', detail: 'R$ 10', description: 'Um detalhe que muda a expressão inteira.' },
  { number: '04', name: 'Limpeza de pele', detail: 'R$ 15', description: 'Cuidado complementar para renovar o rosto.' },
  { number: '05', name: 'Bigode e cavanhaque', detail: 'Completo na navalha · R$ 10', description: 'Contorno definido, presença sem excesso.' },
]

const plans = [
  { slug: '2-cortes', name: '2 cortes', oldPrice: 'R$ 70', price: 'R$ 60', economy: 'R$ 10', note: 'Para manter seu ritmo e fazer parte da comunidade.', details: ['2 cortes tradicionais', 'Sobrancelha de brinde', 'Economia de R$ 10 no mês', 'Consumo dentro de 30 dias'], featured: false, tone: 'purple' },
  { slug: '4-cortes', name: '4 cortes', oldPrice: 'R$ 140', price: 'R$ 125', economy: 'R$ 15', note: 'Presença constante para quem vive o estilo.', details: ['4 cortes tradicionais', 'Sobrancelha de brinde', 'Economia de R$ 15 no mês', 'Consumo dentro de 30 dias'], featured: true, tone: 'yellow' },
  { slug: '2-cortes-2-barbas', name: '2 cortes + 2 barbas', oldPrice: 'R$ 120', price: 'R$ 110', economy: 'R$ 10', note: 'Um cuidado completo para a sua rotina.', details: ['2 cortes tradicionais', '2 barbas completas', 'Sobrancelha de brinde', 'Economia de R$ 10 no mês'], featured: false, tone: 'purple' },
  { slug: '4-cortes-2-barbas', name: '4 cortes + 2 barbas', oldPrice: 'R$ 190', price: 'R$ 175', economy: 'R$ 15', note: 'Mais frequência, mais identidade, mais comunidade.', details: ['4 cortes tradicionais', '2 barbas completas', 'Sobrancelha de brinde', 'Economia de R$ 15 no mês'], featured: false, tone: 'yellow' },
  { slug: '4-cortes-4-barbas', name: '4 cortes + 4 barbas', oldPrice: 'R$ 240', price: 'R$ 200', economy: 'R$ 40', note: 'A experiência completa para estar sempre presente.', details: ['4 cortes tradicionais', '4 barbas completas', 'Sobrancelha de brinde', 'Economia de R$ 40 no mês'], featured: false, tone: 'purple' },
]

const phoneHref = (phone) => `https://wa.me/55${phone}`
const formatDate = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
const toDateValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const monthTitle = (date) => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)

function InternalLink({ href, children, className = '', onClick }) {
  const handleClick = (event) => {
    if (href.startsWith('/')) {
      event.preventDefault()
      window.history.pushState({}, '', href)
      window.dispatchEvent(new PopStateEvent('popstate'))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    onClick?.()
  }
  return <a className={className} href={href} onClick={handleClick}>{children}</a>
}

function Header({ menu, setMenu }) {
  const closeMenu = () => setMenu(false)
  return <header className="site-header">
    <InternalLink className="brand" href="/#inicio" onClick={closeMenu}><img src="/manus-storage/logo_41568a93.jpeg" alt="Street Barber Shop" /><span>STREET<small>BARBER SHOP</small></span></InternalLink>
    <nav className={menu ? 'open' : ''} aria-label="Navegação principal">
      <a href="/#servicos" onClick={closeMenu}>Serviços</a><InternalLink href="/planos" onClick={closeMenu}>Planos</InternalLink><a href="/#barbeiros" onClick={closeMenu}>Barbeiros</a><a href="/#contato" onClick={closeMenu}>Contato</a><InternalLink href="/planos" className="nav-cta" onClick={closeMenu}>Conhecer planos <ArrowRight size={15} /></InternalLink>
    </nav>
    <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label={menu ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menu}>{menu ? <X /> : <Menu />}</button>
  </header>
}

function BarberCard({ barber }) {
  return <article className="barber-card">
    <div className="photo-wrap"><img src={barber.photo} alt={`Barbeiro ${barber.name}`} loading="lazy" decoding="async" /><span>ASSISTENTE {barber.assistant.toUpperCase()}</span></div>
    <div className="card-body"><h3>{barber.name}</h3><p className="assistant-line">Assistente pessoal: {barber.assistant}</p><p className="barber-description">{barber.description}</p><div className="contact-row"><a href={phoneHref(barber.phone)} target="_blank" rel="noreferrer"><MessageCircle size={14} /> {barber.display}</a><a href={phoneHref(barber.phone)} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a><a href={`https://instagram.com/${barber.instagram.slice(1)}`} target="_blank" rel="noreferrer"><Camera size={14} /> {barber.instagram}</a></div><InternalLink className="dark-btn" href={barber.chatbot}>Realize seu agendamento <ArrowUpRight size={15} /></InternalLink></div>
  </article>
}

function ServiceCard({ service, index }) {
  const Icon = serviceIcons[index]
  return <article className="service-card"><div className="service-card-top"><span className="service-number">{service.number}</span><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></div><h3>{service.name}</h3><p className="service-detail">{service.detail}</p><p className="service-description">{service.description}</p><a href="#barbeiros" className="service-link">Falar com um barbeiro <ArrowRight size={15} /></a></article>
}

function AssistantPage({ barber }) {
  const [step, setStep] = useState(0)
  const [value, setValue] = useState('')
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const schedule = trpc.appointments.schedule.useQuery({ barberSlug: barber.slug, appointmentDate: selectedDate || '2000-01-01' }, { enabled: Boolean(selectedDate), staleTime: 15000 })
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' })
  const [bookingError, setBookingError] = useState('')
  const createBooking = trpc.appointments.create.useMutation()
  const [messages, setMessages] = useState([{ type: 'bot', text: `Olá! Eu sou o ${barber.assistant}, assistente do ${barber.name}.` }, { type: 'bot', text: 'Vamos dar início ao seu agendamento? Me informe seu nome completo:' }])
  const today = useMemo(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()) }, [])
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const calendarDays = useMemo(() => { const year = calendarMonth.getFullYear(); const month = calendarMonth.getMonth(); const firstWeekday = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate(); return Array.from({ length: firstWeekday + daysInMonth }, (_, index) => { if (index < firstWeekday) return { empty: true, key: `empty-${index}` }; const date = new Date(year, month, index - firstWeekday + 1); return { empty: false, key: toDateValue(date), value: toDateValue(date), day: date.getDate(), available: date >= today && ![0, 1].includes(date.getDay()) } }) }, [calendarMonth, today])
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoPrevious = calendarMonth > currentMonth
  const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0)
  const times = useMemo(() => Array.from({ length: 23 }, (_, index) => { const total = 9 * 60 + index * 30; const end = total + totalDuration; const occupied = schedule.data?.some((slot) => { const slotStart = Number(slot.startTime.slice(0, 2)) * 60 + Number(slot.startTime.slice(3, 5)); const slotEnd = Number(slot.endTime.slice(0, 2)) * 60 + Number(slot.endTime.slice(3, 5)); return total < slotEnd && end > slotStart }) ?? false; return { value: `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`, available: end <= 20 * 60 && !occupied } }).filter((slot) => slot.available).map((slot) => slot.value), [schedule.data, totalDuration])
  const addBotMessage = (text) => setMessages((current) => [...current, { type: 'bot', text }])
  const submitAnswer = (event) => {
    event.preventDefault(); const answer = value.trim(); if (!answer) return
    setMessages((current) => [...current, { type: 'user', text: answer }])
    setCustomer((current) => ({ ...current, ...(step === 0 ? { name: answer } : step === 1 ? { phone: answer } : { email: answer }) }))
    if (step === 0) addBotMessage(`Prazer, ${answer}! Informe seu número de telefone:`)
    if (step === 1) addBotMessage('Perfeito. Agora me informe seu e-mail:')
    if (step === 2) addBotMessage('Cadastro iniciado. Selecione um ou mais serviços para o atendimento:')
    setValue(''); setStep((current) => current + 1)
  }
  const toggleService = (service) => {
    const exists = selectedServices.some((item) => item.name === service.name)
    const next = exists ? selectedServices.filter((item) => item.name !== service.name) : [...selectedServices, service]
    setSelectedServices(next)
  }
  const continueServices = () => {
    if (!selectedServices.length) return
    setMessages((current) => [...current, { type: 'user', text: selectedServices.map((service) => `${service.name} · ${service.price}`).join(' + ') }, { type: 'bot', text: `Perfeito. Esse atendimento soma ${totalDuration} minutos. Escolha o dia:` }]); setStep(4)
  }
  const chooseDate = (date) => { if (!date.available) return; setSelectedDate(date.value); setMessages((current) => [...current, { type: 'user', text: formatDate(date.value) }, { type: 'bot', text: `Agora escolha o horário. Mostrando opções compatíveis com ${totalDuration} minutos:` }]); setStep(5) }
  const chooseTime = (time) => {
    if (createBooking.isPending) return
    setBookingError('')
    const serviceSlugs = selectedServices.map((service) => service.name === 'Corte' ? 'corte' : service.name === 'Barba' ? 'barba' : service.name === 'Sobrancelha' ? 'sobrancelha' : service.name === 'Limpeza de pele' ? 'limpeza-de-pele' : 'bigode-e-cavanhaque')
    createBooking.mutate({ barberSlug: barber.slug, name: customer.name, phone: customer.phone, email: customer.email, serviceSlugs, appointmentDate: selectedDate, startTime: time }, {
      onSuccess: () => {
        setSelectedTime(time)
        setMessages((current) => [...current, { type: 'user', text: time }, { type: 'bot', text: `Agendamento confirmado com ${barber.name}! Seus serviços foram reservados para ${formatDate(selectedDate)} às ${time}. Duração estimada: ${totalDuration} minutos.` }])
        setStep(6)
      },
      onError: (error) => {
        setBookingError(error.message)
        addBotMessage(error.message)
      },
    })
  }
  return <div className="app inner-page"><Header menu={false} setMenu={() => {}} /><main className="chat-page"><InternalLink className="back-link" href="/#barbeiros">← Voltar para a barbearia</InternalLink><section className={`chat-shell assistant-${barber.slug}`} style={{ '--assistant-accent': barber.identity.accent, '--assistant-soft': barber.identity.soft }}><div className="chat-header"><img src={barber.identity.avatar} alt={`Retrato do assistente ${barber.assistant}`} decoding="async" /><div><p className="eyebrow assistant-kicker">{barber.identity.label}</p><h1>{barber.assistant}</h1><span><b className="assistant-signature">{barber.identity.signature}</b><br />Assistente de {barber.name}</span></div><MessageCircle size={19} /></div><div className="chat-messages" aria-live="polite">{messages.map((message, index) => <div className={message.type === 'user' ? 'chat-row user' : 'chat-row'} key={`${message.text}-${index}`}><span className={`chat-avatar ${message.type === 'user' ? 'user-avatar' : 'assistant-avatar'}`}>{message.type === 'user' ? 'Você' : <img src={barber.identity.avatar} alt={`Avatar do assistente ${barber.assistant}`} loading="lazy" decoding="async" />}</span><div className="chat-bubble">{message.text}</div></div>)}</div>{step < 3 ? <form className="chat-input" onSubmit={submitAnswer}><label htmlFor="chat-answer">{['Nome completo', 'Número de telefone', 'E-mail'][step]}</label><div><input id="chat-answer" type={['text', 'tel', 'email'][step]} value={value} onChange={(event) => setValue(event.target.value)} placeholder={['Nome completo', 'Número de telefone', 'E-mail'][step]} autoFocus /><button className="send-btn" type="submit" aria-label="Enviar resposta"><ArrowRight size={17} /></button></div></form> : step === 3 ? <div className="chat-options"><label>Serviços desejados · selecione quantos quiser</label><div className="service-choice-grid">{barber.services.map((service) => <button type="button" className={selectedServices.some((item) => item.name === service.name) ? 'choice-btn selected' : 'choice-btn'} onClick={() => toggleService(service)} key={service.name}><span><b>{service.name}</b><small>{service.duration} min</small></span><strong>{service.price}</strong></button>)}</div><div className="selection-summary">{selectedServices.length ? `${selectedServices.length} serviço(s) · ${totalDuration} minutos` : 'Nenhum serviço selecionado'}<button type="button" className="continue-choice" disabled={!selectedServices.length} onClick={continueServices}>Continuar <ArrowRight size={15} /></button></div></div> : step === 4 ? <div className="chat-options calendar-options"><label>Escolha o dia</label><div className="calendar-card"><div className="calendar-toolbar"><button type="button" className="calendar-nav" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} disabled={!canGoPrevious} aria-label="Mês anterior"><ChevronLeft size={17} /></button><strong>{monthTitle(calendarMonth)}</strong><button type="button" className="calendar-nav" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} aria-label="Próximo mês"><ChevronRight size={17} /></button></div><div className="calendar-weekdays">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}</div><div className="calendar-grid">{calendarDays.map((date) => date.empty ? <span className="calendar-day empty" key={date.key} aria-hidden="true" /> : <button type="button" className={selectedDate === date.value ? 'calendar-day selected' : date.available ? 'calendar-day available' : 'calendar-day blocked'} disabled={!date.available} onClick={() => chooseDate(date)} key={date.key} aria-label={`${formatDate(date.value)} — ${date.available ? 'Disponível' : 'Indisponível'}`}><b>{date.day}</b>{date.available && <small>Disponível</small>}</button>)}</div><div className="calendar-legend"><span><i className="legend-dot available-dot" /> Disponível</span><span><i className="legend-dot blocked-dot" /> Indisponível</span></div></div></div> : step === 5 ? <div className="chat-options"><label>Horários compatíveis com {totalDuration} minutos · terça a sábado, 09h às 20h</label>{bookingError && <p className="booking-error" role="alert">{bookingError}</p>}<div className="time-options">{times.map((time) => <button type="button" className={selectedTime === time ? 'choice-btn selected' : 'choice-btn'} onClick={() => chooseTime(time)} disabled={createBooking.isPending} key={time}>{createBooking.isPending && selectedTime === time ? 'Reservando…' : time}</button>)}</div><small className="schedule-note">20:00 é o último horário selecionável do dia.</small></div> : <div className="chat-complete"><Check size={18} /><span>Agendamento confirmado e reservado na agenda de {barber.name}.</span></div>}</section></main></div>
}

function ClubPage() { return <div className="app inner-page"><Header menu={false} setMenu={() => {}} /><main className="club-page"><p className="eyebrow">STREET CLUB · EM BREVE</p><h1>O próximo nível<br /><em>da sua presença.</em></h1><p className="page-lead">Estamos preparando um clube com benefícios, pacotes e vantagens para quem faz da presença um compromisso.</p><div className="club-placeholder"><Sparkles size={21} /><span>Área exclusiva em construção</span><small>Em breve, você poderá ativar seu plano por aqui.</small></div><InternalLink className="secondary light-secondary" href="/planos"><ArrowRight size={17} /> Voltar para os planos</InternalLink></main></div> }

function PlanCard({ plan, index }) {
  const [open, setOpen] = useState(false)
  return <article className={`plan-card ${plan.tone} ${plan.featured ? 'featured' : ''} ${open ? 'is-open' : ''}`}>
    <button type="button" className="plan-card-trigger" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={`plan-details-${plan.slug}`}>
      <span className="plan-index">PLANO 0{index + 1}</span>{plan.featured && <span className="featured-label">MAIS ESCOLHIDO</span>}
      <h2>{plan.name}</h2><div className="plan-prices"><del>{plan.oldPrice}</del><strong>{plan.price}</strong></div><p>{plan.note}</p>
      <span className="plan-toggle">{open ? 'Fechar especificações' : 'Ver economia e especificações'} <ArrowRight size={14} /></span>
    </button>
    <div className="plan-details" id={`plan-details-${plan.slug}`} hidden={!open}>
      <p className="economy-line"><Sparkles size={14} /> Economia de <b>{plan.economy}</b></p>
      <div className="plan-perks">{plan.details.map((detail) => <span key={detail}><Check size={14} /> {detail}</span>)}<span><Check size={14} /> Plano mensal Street Community</span></div>
      <InternalLink className="plan-link" href={`/planos/${plan.slug}`}>Conheça o clube <ArrowUpRight size={15} /></InternalLink>
    </div>
  </article>
}

function PlansPage() { return <div className="app inner-page"><Header menu={false} setMenu={() => {}} /><main className="plans-page"><div className="plans-page-intro"><p className="eyebrow plans-kicker">PLANOS:</p><span className="vip-marker" role="status" aria-label="Convite para o clube VIP"><span className="vip-dot" aria-hidden="true"></span></span><p className="eyebrow community-kicker">STREET COMMUNITY · BENEFÍCIOS</p><h1>BEM-VINDO À<br /><em>COMUNIDADE STREET BARBER SHOP</em></h1><p className="page-lead"><strong>Mais do que uma barbearia. Uma comunidade de benefícios.</strong><br /><br />Torne-se um Cliente VIP Street Barber Shop e tenha acesso a benefícios exclusivos em estabelecimentos parceiros da nossa rede.<br /><br />Escolha um dos nossos planos mensais e aproveite descontos, vantagens especiais e experiências exclusivas pensadas para quem faz parte da nossa comunidade.<br /><br />Assine seu plano, aproveite os benefícios e faça parte da Street Barber Shop.</p></div><div className="plans-page-grid">{plans.map((plan, index) => <PlanCard plan={plan} index={index} key={plan.name} />)}</div><div className="plan-bottom-note"><Sparkles size={19} /><p><b>Seu estilo aproxima pessoas.</b><br />Escolha um plano e faça parte de uma comunidade relacionada por cuidado, presença e atitude.</p></div></main></div> }

function LegacyHome() { const [menu, setMenu] = useState(false); return <div className="app"><Header menu={menu} setMenu={setMenu} /><main><section id="inicio" className="hero phase-one"><div className="hero-copy"><p className="eyebrow">BARBEARIA · ESTILO · PRESENÇA</p><h1>Atitude não se<br />improvisa,<br /><em>se cultiva na<br />cadeira certa.</em></h1><p className="lead">Atendimento especializado, técnica e cuidado para entregar um visual à altura da sua identidade.</p><div className="hero-actions"><a className="primary" href="#servicos">Conhecer serviços <ArrowRight size={19} /></a><InternalLink className="secondary" href="/planos">Conhecer os planos <Sparkles size={18} /></InternalLink></div><div className="hero-meta"><span><Clock3 size={18} /> Terça a sábado</span><span><MapPin size={18} /> Nonoai, RS</span></div></div><div className="hero-card"><div className="hero-card-top"><span className="hero-card-tag">STREET</span><span className="hero-card-label">BARBER SHOP</span></div><div className="hero-card-brand"><img src="/manus-storage/logo_41568a93.jpeg" alt="Logo Street Barber Shop" /></div><p className="hero-card-kicker">SEU ESTILO, SUA ASSINATURA</p><h2>Presença que<br /><em>se reconhece.</em></h2><div className="hero-card-rule"><span></span></div><div className="hero-card-stats"><div><strong>03</strong><span>barbeiros</span></div><div><strong>05</strong><span>serviços</span></div><div><strong>VIP</strong><span>community</span></div></div></div></section><section id="servicos" className="section dark-section service-section phase-two"><div className="section-head"><div><h2>O cuidado que<br /><em>seu estilo merece.</em></h2></div><p>Cinco escolhas objetivas para sair da cadeira com o visual alinhado aos seus detalhes.</p></div><div className="service-grid">{services.map((service, index) => <ServiceCard service={service} index={index} key={service.name} />)}</div></section><section id="clube" className="club-teaser phase-three"><div className="club-teaser-head"><div><h2>Mais que um corte.<br /><em>Uma comunidade.</em></h2><p>Planos pensados para quem valoriza constância, cuidado e pertencimento. Você mantém seu visual em dia e se aproxima de uma comunidade relacionada pelo mesmo estilo de vida.</p></div><div className="club-mark"><img src="/manus-storage/logo_41568a93.jpeg" alt="Logo oficial Street Barber Shop" /><span className="club-mark-signature" aria-label="Street Community"><b>STREET</b><i>COMMUNITY</i></span></div></div><div className="home-plans-section"><div className="home-plans-intro"><p className="eyebrow plans-kicker">PLANOS:</p><span className="vip-marker" role="status" aria-label="Convite para o clube VIP"><span className="vip-dot" aria-hidden="true"></span></span><h3>BEM-VINDO À<br /><em>COMUNIDADE STREET BARBER SHOP</em></h3><p>Mais do que uma barbearia. Uma comunidade de benefícios.</p><p>Torne-se um Cliente VIP Street Barber Shop e tenha acesso a benefícios exclusivos em estabelecimentos parceiros da nossa rede.</p><p>Escolha um dos nossos planos mensais e aproveite descontos, vantagens especiais e experiências exclusivas pensadas para quem faz parte da nossa comunidade.</p><p>Assine seu plano, aproveite os benefícios e faça parte da Street Barber Shop.</p></div><div className="plans-page-grid home-plans-grid">{plans.map((plan, index) => <PlanCard plan={plan} index={index} key={plan.name} />)}</div><p className="home-plans-note"><Sparkles size={17} /> Clique em um plano para conferir a economia, a sobrancelha de brinde, a validade de 30 dias e as especificações.</p></div></section><section id="barbeiros" className="section light barber-section phase-four"><div className="section-head"><div><h2>Três estilos.<br /><em>Uma só atitude.</em></h2></div><p>Escolha seu barbeiro e entre diretamente na conversa do assistente. Selecione quantos serviços quiser, escolha o dia e o horário.</p></div><div className="barber-grid">{barbers.map((barber) => <BarberCard barber={barber} key={barber.name} />)}</div></section><section id="contato" className="contact phase-five"><div><h2>Nos vemos<br /><em>na cadeira.</em></h2></div><div className="contact-info"><a href="https://maps.app.goo.gl/qxyhNH2j1vgX8MMP6?g_st=iw" target="_blank" rel="noreferrer"><MapPin size={20} /> Nonoai, Rio Grande do Sul</a><a href="https://instagram.com/street.barbeer.shop" target="_blank" rel="noreferrer"><Camera size={20} /> @street.barbeer.shop</a><span><Clock3 size={20} /> Terça a sábado · 09h às 20h</span></div></section></main><footer><InternalLink className="brand" href="/#inicio"><img src="/manus-storage/logo_41568a93.jpeg" alt="Street Barber Shop" /><span>STREET<small>BARBER SHOP</small></span></InternalLink><span>© 2026 Street Barber Shop</span><span>Atitude na cadeira certa.</span><InternalLink className="admin-footer-link" href="/admin">Área interna</InternalLink></footer></div> }

function PlanDetailPage({ plan }) { return <div className="app inner-page"><Header menu={false} setMenu={() => {}} /><main className="plan-detail-page"><InternalLink className="back-link" href="/planos">← Voltar para os planos</InternalLink><p className="eyebrow">STREET COMMUNITY · PLANO MENSAL</p><h1>{plan.name}<br /><em>Street Community.</em></h1><p className="page-lead">{plan.note}</p><section className="plan-detail-card"><div><span className="plan-index">PLANO STREET</span><h2>O que está incluído</h2><p>Uma rotina de cuidado com benefícios pensados para quem faz da presença um compromisso.</p></div><div className="plan-detail-price"><del>{plan.oldPrice}</del><strong>{plan.price}</strong><span>Economia de {plan.economy}</span></div><div className="plan-perks">{plan.details.map((detail) => <span key={detail}><Check size={14} /> {detail}</span>)}</div></section><InternalLink className="secondary" href="/clube"><ArrowRight size={17} /> Conhecer o clube</InternalLink></main></div> }

export default function PublicSite() { const [path, setPath] = useState(window.location.pathname); useEffect(() => { const onPopState = () => setPath(window.location.pathname); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState) }, []); if (path === '/planos') return <PlansPage />; if (path.startsWith('/planos/')) { const plan = plans.find((item) => item.slug === decodeURIComponent(path.slice('/planos/'.length))); if (plan) return <PlanDetailPage plan={plan} /> } if (path === '/clube') return <ClubPage />; const assistantMatch = path.match(/^\/assistentes\/(luan|bruno|kaua)$/); if (assistantMatch) return <AssistantPage barber={barbers.find((barber) => barber.slug === assistantMatch[1])} />; return <Home /> }



function Home() {
  const [menu, setMenu] = useState(false)
  return <div className="app"><Header menu={menu} setMenu={setMenu} /><main>
    <section id="inicio" className="hero phase-one"><div className="hero-copy"><p className="eyebrow">BARBEARIA · ESTILO · PRESENÇA</p><h1>Atitude não se<br />improvisa,<br /><em>se cultiva na<br />cadeira certa.</em></h1><p className="lead">Atendimento especializado, técnica e cuidado para entregar um visual à altura da sua identidade.</p><div className="hero-actions"><a className="primary" href="#servicos">Conhecer serviços <ArrowRight size={19} /></a><InternalLink className="secondary" href="/planos">Conhecer os planos <Sparkles size={18} /></InternalLink></div><div className="hero-meta"><span><Clock3 size={18} /> Terça a sábado</span><span><MapPin size={18} /> Nonoai, RS</span></div></div><div className="hero-card"><div className="hero-card-top"><span className="hero-card-tag">STREET</span><span className="hero-card-label">BARBER SHOP</span></div><div className="hero-card-brand"><img src="/manus-storage/logo_41568a93.jpeg" alt="Logo Street Barber Shop" /></div><p className="hero-card-kicker">SEU ESTILO, SUA ASSINATURA</p><h2>Presença que<br /><em>se reconhece.</em></h2><div className="hero-card-rule"><span></span></div><div className="hero-card-stats"><div><strong>03</strong><span>barbeiros</span></div><div><strong>05</strong><span>serviços</span></div><div><strong>VIP</strong><span>community</span></div></div></div></section>
    <section id="barbeiros" className="section light barber-section phase-two"><div className="section-head"><div><p className="eyebrow dark">CONHEÇA NOSSA EQUIPE</p><h2>Conheça nossos<br /><em>barbeiros.</em></h2></div><p>Escolha seu barbeiro e entre diretamente na conversa do assistente. Selecione quantos serviços quiser, escolha o dia e o horário.</p></div><div className="barber-grid">{barbers.map((barber) => <BarberCard barber={barber} key={barber.name} />)}</div></section>
    <section id="servicos" className="section dark-section service-section phase-three"><div className="section-head"><div><h2>O cuidado que<br /><em>seu estilo merece.</em></h2></div><p>Cinco escolhas objetivas para sair da cadeira com o visual alinhado aos seus detalhes.</p></div><div className="service-grid">{services.map((service, index) => <ServiceCard service={service} index={index} key={service.name} />)}</div></section>
    <section id="clube" className="club-teaser phase-four"><div className="club-teaser-head"><div><p className="eyebrow">STREET COMMUNITY · BENEFÍCIOS</p><h2>Conheça nossos<br /><em>planos.</em></h2><p>Planos pensados para quem valoriza constância, cuidado e pertencimento. Você mantém seu visual em dia e se aproxima de uma comunidade relacionada pelo mesmo estilo de vida.</p><a className="primary" href="#planos">Conhecer nossos planos <ArrowRight size={17} /></a></div><div className="club-mark"><img src="/manus-storage/logo_41568a93.jpeg" alt="Logo oficial Street Barber Shop" /><span className="club-mark-signature" aria-label="Street Community"><b>STREET</b><i>COMMUNITY</i></span></div></div></section>
    <section id="planos" className="section dark-section home-plans-section phase-five"><div className="home-plans-intro"><p className="eyebrow plans-kicker">PLANOS:</p><span className="vip-marker" role="status" aria-label="Convite para o clube VIP"><span className="vip-dot" aria-hidden="true"></span></span><h3>BEM-VINDO À<br /><em>COMUNIDADE STREET BARBER SHOP</em></h3><p>Mais do que uma barbearia. Uma comunidade de benefícios.</p><p>Torne-se um Cliente VIP Street Barber Shop e tenha acesso a benefícios exclusivos em estabelecimentos parceiros da nossa rede.</p><p>Escolha um dos nossos planos mensais e aproveite descontos, vantagens especiais e experiências exclusivas pensadas para quem faz parte da nossa comunidade.</p><p>Assine seu plano, aproveite os benefícios e faça parte da Street Barber Shop.</p></div><div className="plans-page-grid home-plans-grid">{plans.map((plan, index) => <PlanCard plan={plan} index={index} key={plan.name} />)}</div><p className="home-plans-note"><Sparkles size={17} /> Clique em um plano para conferir a economia, a sobrancelha de brinde, a validade de 30 dias e as especificações.</p></section>
    <section id="contato" className="contact phase-six"><div><p className="eyebrow">CONSIDERAÇÕES FINAIS</p><h2>Nos vemos<br /><em>na cadeira.</em></h2></div><div className="contact-info"><a href="https://maps.app.goo.gl/qxyhNH2j1vgX8MMP6?g_st=iw" target="_blank" rel="noreferrer"><MapPin size={20} /> Nonoai, Rio Grande do Sul</a><a href="https://instagram.com/street.barbeer.shop" target="_blank" rel="noreferrer"><Camera size={20} /> @street.barbeer.shop</a><span><Clock3 size={20} /> Terça a sábado · 09h às 20h</span></div></section>
  </main><footer><InternalLink className="brand" href="/#inicio"><img src="/manus-storage/logo_41568a93.jpeg" alt="Street Barber Shop" /><span>STREET<small>BARBER SHOP</small></span></InternalLink><span>© 2026 Street Barber Shop</span><span>Atitude na cadeira certa.</span><InternalLink className="admin-footer-link" href="/admin">Área interna</InternalLink></footer></div>
}
