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
    slug: 'luan', name: 'Luan Bringhenti', assistant: 'Lucas', phone: '49991570099', display: '(49) 99157-0099', instagram: '@luan_barbeer', photo: '/manus-storage/luan_e357146c.jpeg', description: 'Atendimento cuidadoso, conversa leve e precisão em cada detalhe.', chatbot: '/assistentes/luan', identity: { label: 'PRECISÃO CLÁSSICA', signature: 'Corte limpo · presença certa', accent: '#d7b27e', soft: '#3b3025', avatar: '/manus-storage/lucas_8a22a8ee.png' },
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
    slug: 'kaua', name: 'Kauã dos Santos', assistant: 'Noah', phone: '549996290897', display: '(54) 99962-90897', instagram: '@kaua_barbeer', photo: '/manus-storage/kaua_ae2b8882.jpeg', description: 'Técnica, personalidade e acabamento para sair se sentindo bem.', chatbot: '/assistentes/kaua', identity: { label: 'DETALHE AUTORAL', signature: 'Traço preciso · identidade própria', accent: '#a8bd78', soft: '#303a27', avatar: '/manus-storage/noah_77a56205.png' },
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

const dbPlanToView = (plan) => ({ ...plan, oldPrice: `R$ ${(plan.oldPriceCents / 100).toFixed(0)}`, price: `R$ ${(plan.priceCents / 100).toFixed(0)}`, economy: `R$ ${(plan.economyCents / 100).toFixed(0)}`, details: Array.isArray(plan.details) ? plan.details : [], featured: Boolean(plan.featured), tone: plan.tone || 'purple' })

function usePlanCatalog() {
  const query = trpc.club.plans.useQuery(undefined, { staleTime: 60000 })
  return query.data?.length ? query.data.map(dbPlanToView) : plans
}

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
    <InternalLink className="brand" href="/#inicio" onClick={closeMenu}><img src="/manus-storage/street-barber-logo-4k_bd58c9b0.png" alt="Street Barber Shop" /><span>STREET<small>BARBER SHOP</small></span></InternalLink>
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

function ClubHeader() {
  const [menu, setMenu] = useState(false)
  const closeMenu = () => setMenu(false)
  return <header className="site-header club-site-header"><InternalLink className="brand" href="/#inicio" onClick={closeMenu}><img src="/manus-storage/street-barber-logo-4k_bd58c9b0.png" alt="Street Barber Shop" /><span>STREET<small>BARBER SHOP</small></span></InternalLink><button type="button" className="club-mobile-toggle" aria-label={menu ? 'Fechar menu do Clube' : 'Abrir menu do Clube'} aria-expanded={menu} onClick={() => setMenu((current) => !current)}>{menu ? <X size={23} /> : <Menu size={23} />}</button><nav className={menu ? 'open' : ''} aria-label="Navegação do Street Barber Clube"><InternalLink href="/clube#planos-clube" onClick={closeMenu}>Planos</InternalLink><InternalLink href="/#inicio" className="nav-cta" onClick={closeMenu}>Voltar ao site <ArrowRight size={15} /></InternalLink></nav></header>
}

function ClubPlanShowcase({ catalog, selectedSlug, onSelect, onContract }) {
  return <section id="planos-clube" className="club-section club-plans-showcase"><div className="club-section-heading"><p className="eyebrow">ESCOLHA O SEU RITMO</p><h2>Um plano para cada<br /><em>forma de viver o estilo.</em></h2><p>Escolha seu plano e entre para o Clube.</p></div><div className="club-plan-ribbon">{catalog.map((plan, index) => <article className={`club-premium-plan ${plan.tone} ${plan.featured ? 'is-featured' : ''} ${selectedSlug === plan.slug ? 'is-selected' : ''}`} key={plan.slug}><div className="club-plan-topline"><span>0{index + 1}</span>{plan.featured && <b>RECOMENDADO</b>}</div><h3>{plan.name}</h3><p>{plan.note}</p><div className="club-plan-price"><del>{plan.oldPrice}</del><strong>{plan.price}</strong><small>/ 30 dias</small></div><div className="club-plan-details">{plan.details.slice(0, 4).map((detail) => <span key={detail}><Check size={13} /> {detail}</span>)}</div><button type="button" className="club-plan-cta" onClick={() => { onSelect(plan.slug); onContract() }}>{selectedSlug === plan.slug ? 'Plano selecionado' : 'Escolher plano'} <ArrowRight size={15} /></button></article>)}</div></section>
}

function ClubRoulette() {
  const segments = ['5% OFF', '10% OFF', '15% OFF', 'BRINDE', '20% OFF', 'EXTRA']
  const [spinning, setSpinning] = useState(false)
  useEffect(() => { if (!spinning) return; const timer = window.setTimeout(() => setSpinning(false), 2400); return () => window.clearTimeout(timer) }, [spinning])
  const activate = () => { if (!spinning) setSpinning(true) }
  const handleKeyDown = (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate() } }
  return <section id="roleta" className="club-roulette-section"><div className="club-roulette-copy"><p className="eyebrow">DESCONTOS DO CLUBE</p><h2>Gire para<br /><em>ver as vantagens.</em></h2><p>Conheça as possibilidades e escolha seu plano para ativar o benefício no cadastro.</p></div><div className="club-wheel-stage"><span className="club-wheel-pointer" aria-hidden="true">▼</span><div className={spinning ? 'club-wheel is-spinning' : 'club-wheel'} role="button" tabIndex={spinning ? -1 : 0} aria-disabled={spinning} aria-label="Girar roleta de descontos" onClick={activate} onKeyDown={handleKeyDown}>{segments.map((segment, index) => <span key={`${segment}-${index}`} style={{ '--segment-index': index }}>{segment}</span>)}</div><div className="club-wheel-result" role="status">{spinning ? 'Girando…' : 'Escolha um plano para ativar'}</div></div><button type="button" className="primary club-wheel-button" onClick={activate} disabled={spinning}>{spinning ? 'Girando…' : 'Girar descontos'} <Sparkles size={16} /></button></section>
}

const sponsorOrder = ['Armazém Lounge Bar', 'Hudrin Style', 'La Tiendita Café', 'IR Agro', 'Academia Império Fitness', 'CD Fight Team']
const sponsorPalette = {
  'Armazém Lounge Bar': ['#2b2623', '#b58a54'],
  'Hudrin Style': ['#242426', '#aeb2b9'],
  'La Tiendita Café': ['#263526', '#91a96c'],
  'IR Agro': ['#123e2d', '#59bb6d'],
  'Academia Império Fitness': ['#223b7a', '#8ebcff'],
  'CD Fight Team': ['#242323', '#ed3444'],
}

function ClubSponsorMural({ partners }) {
  const activePartners = [...(partners.data || [])].sort((a, b) => {
    const aIndex = sponsorOrder.indexOf(a.name)
    const bIndex = sponsorOrder.indexOf(b.name)
    return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex) || a.id - b.id
  })
  return <section id="patrocinadores" className="club-sponsor-mural"><div className="club-sponsor-heading"><p className="eyebrow">PARCEIROS STREET</p><h2>Marcas que<br /><em>caminham com a gente.</em></h2><p>Conheça quem faz parte da nossa rede.</p></div>{activePartners.length ? <div className="club-sponsor-grid">{activePartners.map((partner) => { const palette = sponsorPalette[partner.name] || ['#2b2927', '#c9b294']; return <article className="club-sponsor-card" style={{ '--sponsor-base': palette[0], '--sponsor-accent': palette[1] }} key={partner.id}><div className="club-sponsor-logo">{partner.logoUrl || partner.logo ? <img src={partner.logoUrl || partner.logo} alt={`Logo ${partner.name}`} loading="lazy" decoding="async" /> : <span>{partner.name.slice(0, 2).toUpperCase()}</span>}</div><div className="club-sponsor-card-copy"><span>PARCEIRO STREET</span><h3>{partner.name}</h3><p>{partner.description || 'Presença que fortalece a comunidade.'}</p></div></article> })}</div> : <p className="club-empty-note">Os parceiros serão exibidos assim que forem cadastrados.</p>}</section>
}

function ClubBarberPicker({ barberCatalog, selectedBarberSlug, onSelect }) {
  const activeBarbers = barberCatalog.data?.map((barber) => ({ ...barber, photo: barbers.find((item) => item.slug === barber.slug)?.photo })) || []
  return <fieldset className="club-barber-picker" disabled={barberCatalog.isLoading || !activeBarbers.length}><legend>1 · Escolha seu barbeiro</legend>{barberCatalog.isLoading ? <p className="club-picker-status">Carregando barbeiros…</p> : !activeBarbers.length ? <p className="club-picker-status">Nenhum barbeiro disponível no momento.</p> : <div className="club-barber-options">{activeBarbers.map((barber) => <button type="button" className={selectedBarberSlug === barber.slug ? 'club-barber-option selected' : 'club-barber-option'} aria-pressed={selectedBarberSlug === barber.slug} onClick={() => onSelect(barber.slug)} key={barber.slug}><img src={barber.photo} alt={`Foto de ${barber.name}`} loading="lazy" decoding="async" /><span><strong>{barber.name}</strong><small>Escolher este barbeiro</small></span><Check size={17} aria-hidden="true" /></button>)}</div>}</fieldset>
}

function ClubPage() {
  const catalog = usePlanCatalog()
  const barberCatalog = trpc.club.barbers.useQuery(undefined, { staleTime: 60000 })
  const partners = trpc.club.partners.useQuery(undefined, { staleTime: 60000 })
  const requestedSlug = new URLSearchParams(window.location.search).get('plano')
  const requestedPlan = trpc.club.plan.useQuery({ slug: requestedSlug || '2-cortes' }, { enabled: Boolean(requestedSlug), retry: false })
  const initialSlug = requestedSlug || catalog[0]?.slug
  const [selectedSlug, setSelectedSlug] = useState(initialSlug)
  const [selectedFromUrl, setSelectedFromUrl] = useState(Boolean(requestedSlug))
  const [selectedBarberSlug, setSelectedBarberSlug] = useState('')
  const [mode, setMode] = useState('explore')
  const [feedback, setFeedback] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', paymentMethod: 'pix' })
  const selectedPlan = catalog.find((plan) => plan.slug === selectedSlug) || catalog[0]
  useEffect(() => { if (requestedPlan.data?.slug) { setSelectedSlug(requestedPlan.data.slug); setSelectedFromUrl(true) } else if (requestedSlug && requestedPlan.isError) { setSelectedSlug(catalog[0]?.slug); setSelectedFromUrl(false) } }, [requestedPlan.data?.slug, requestedPlan.isError, requestedSlug, catalog])
  useEffect(() => { if (mode !== 'explore') window.requestAnimationFrame(() => document.getElementById('club-active-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }, [mode])
  const request = trpc.club.requestSubscription.useMutation()
  const checkoutRequest = trpc.club.checkoutRequest.useMutation()

  const submitRequest = (event) => {
    event.preventDefault()
    if (!selectedPlan || request.isPending) return
    if (!selectedBarberSlug) { setFeedback('Escolha um barbeiro para continuar.'); return }
    setFeedback('')
    request.mutate({ ...form, planSlug: selectedPlan.slug, barberSlug: selectedBarberSlug }, {
      onSuccess: (result) => { setFeedback(`Cadastro registrado para o plano ${selectedPlan.name}. Abrindo o Checkout seguro.`); checkoutRequest.mutate({ subscriptionId: result.subscriptionId, email: form.email, phone: form.phone }, { onSuccess: (checkout) => { if (checkout.checkoutUrl) window.open(checkout.checkoutUrl, '_blank', 'noopener,noreferrer'); setFeedback('Cadastro registrado. Finalize o pagamento no Checkout.') }, onError: (error) => setFeedback(`Cadastro registrado, mas o Checkout não pôde ser aberto: ${error.message}`) }); return result },
      onError: (error) => setFeedback(error.message),
    })
  }

  return <div className="app inner-page club-app"><ClubHeader /><main className="club-page club-page-live"><div className="club-live-hero"><div className="club-hero-copy"><p className="eyebrow">STREET CLUB · SEU CADASTRO</p><h1>O próximo nível<br /><em>da sua presença.</em></h1><p className="page-lead">Uma comunidade de benefícios para manter seu visual em dia, aproveitar vantagens e fazer parte da Street Barber Shop além da cadeira.</p><div className="club-actions"><button type="button" className="primary" onClick={() => setMode('contract')}>Escolher meu plano <ArrowRight size={17} /></button></div></div><div className="club-live-mark"><Crown size={30} /><span>STREET</span><small>STREET COMMUNITY</small><b>MEMBER / 001</b></div></div><div className="club-hero-proof"><span><strong>05</strong> planos oficiais</span><span><strong>30</strong> dias por ciclo</span><span><strong>01</strong> cadastro</span></div><ClubRoulette /><ClubSponsorMural partners={partners} /><ClubPlanShowcase catalog={catalog} selectedSlug={selectedSlug} onSelect={(slug) => { setSelectedSlug(slug); setSelectedBarberSlug(''); window.history.replaceState({}, '', `/clube?plano=${encodeURIComponent(slug)}`) }} onContract={() => setMode('contract')} />
    {feedback && <p className="club-feedback" role="status">{feedback}</p>}
    {mode === 'contract' && <section id="club-active-panel" className="club-panel"><div className="club-panel-head"><div><p className="eyebrow">ATIVAÇÃO DO CLUBE</p><h2>Escolha seu plano<br /><em>e mantenha o ritmo.</em></h2></div><button type="button" className="panel-close" aria-label="Fechar contratação" onClick={() => setMode('explore')}><X size={18} /></button></div><div className="club-plan-selector">{catalog.map((plan) => <button type="button" className={`club-plan-option ${selectedSlug === plan.slug ? 'selected' : ''}`} onClick={() => { setSelectedSlug(plan.slug); setSelectedBarberSlug('') }} key={plan.slug}><span>{plan.name}</span><strong>{plan.price}</strong><small>{plan.details.slice(0, 2).join(' · ')}</small></button>)}</div><form className="club-form" onSubmit={submitRequest}><div className="club-form-grid"><ClubBarberPicker barberCatalog={barberCatalog} selectedBarberSlug={selectedBarberSlug} onSelect={setSelectedBarberSlug} /><label>Nome completo<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Seu nome" /></label><label>Telefone<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="(49) 99999-9999" /></label><label>E-mail<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="voce@email.com" /></label><fieldset className="club-payment-picker"><legend>Forma de pagamento</legend><div className="club-payment-options"><button type="button" className={`club-payment-option ${form.paymentMethod === 'card' ? 'selected' : ''}`} aria-pressed={form.paymentMethod === 'card'} onClick={() => setForm({ ...form, paymentMethod: 'card' })}><span className="club-payment-symbol">▣</span><span><strong>Cartão</strong><small>Checkout seguro Stripe</small></span><Check size={16} aria-hidden="true" /></button><button type="button" className={`club-payment-option ${form.paymentMethod === 'pix' ? 'selected' : ''}`} aria-pressed={form.paymentMethod === 'pix'} onClick={() => setForm({ ...form, paymentMethod: 'pix' })}><span className="club-payment-symbol">◇</span><span><strong>PIX</strong><small>Pagamento instantâneo</small></span><Check size={16} aria-hidden="true" /></button></div></fieldset></div><p className="club-form-note">Escolha seu barbeiro. O cadastro fica ligado ao seu plano após a confirmação do pagamento.</p><button className="primary" type="submit" disabled={request.isPending || checkoutRequest.isPending}>{request.isPending ? 'Registrando…' : `Continuar com ${selectedPlan?.name || 'o plano'}`} <ArrowRight size={16} /></button></form></section>}
    <InternalLink className="secondary light-secondary" href="/planos"><ArrowRight size={17} /> Voltar para os planos</InternalLink><InternalLink className="club-final-link" href="/#inicio">Voltar ao site principal <ArrowUpRight size={15} /></InternalLink></main></div>
}

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
      <InternalLink className="plan-link" href={`/clube?plano=${encodeURIComponent(plan.slug)}`}>Conheça o clube <ArrowUpRight size={15} /></InternalLink>
    </div>
  </article>
}

function PlansPage() { const catalog = usePlanCatalog(); return <div className="app inner-page"><Header menu={false} setMenu={() => {}} /><main className="plans-page"><div className="plans-page-intro"><p className="eyebrow plans-kicker">PLANOS:</p><span className="vip-marker" role="status" aria-label="Convite para o clube VIP"><span className="vip-dot" aria-hidden="true"></span></span><p className="eyebrow community-kicker">STREET COMMUNITY · BENEFÍCIOS</p><h1>BEM-VINDO À<br /><em>COMUNIDADE STREET BARBER SHOP</em></h1><p className="page-lead"><strong>Mais do que uma barbearia. Uma comunidade de benefícios.</strong><br /><br />Torne-se um Cliente VIP Street Barber Shop e tenha acesso a benefícios exclusivos em estabelecimentos parceiros da nossa rede.<br /><br />Escolha um dos nossos planos mensais e aproveite descontos, vantagens especiais e experiências exclusivas pensadas para quem faz parte da nossa comunidade.<br /><br />Assine seu plano, aproveite os benefícios e faça parte da Street Barber Shop.</p></div><div className="plans-page-grid">{catalog.map((plan, index) => <PlanCard plan={plan} index={index} key={plan.slug} />)}</div><div className="plan-bottom-note"><Sparkles size={19} /><p><b>Seu estilo aproxima pessoas.</b><br />Escolha um plano e faça parte de uma comunidade relacionada por cuidado, presença e atitude.</p></div></main></div> }

function LegacyHome() { const [menu, setMenu] = useState(false); const [watermarkLoaded, setWatermarkLoaded] = useState(false); return <div className="app"><Header menu={menu} setMenu={setMenu} /><main><section id="inicio" className="hero phase-one"><img className={watermarkLoaded ? 'hero-watermark is-loaded' : 'hero-watermark'} src="/manus-storage/street-barber-logo-4k_4c930076.webp" alt="" aria-hidden="true" loading="eager" decoding="async" onLoad={() => setWatermarkLoaded(true)} /><div className="hero-copy"><p className="eyebrow">BARBEARIA · ESTILO · PRESENÇA</p><h1>Atitude não se<br />improvisa,<br /><em>se cultiva na<br />cadeira certa.</em></h1><p className="lead">Atendimento especializado, técnica e cuidado para entregar um visual à altura da sua identidade.</p><div className="hero-actions"><a className="primary" href="#servicos">Conhecer serviços <ArrowRight size={19} /></a><InternalLink className="secondary" href="/planos">Conhecer os planos <Sparkles size={18} /></InternalLink></div><div className="hero-meta"><span><Clock3 size={18} /> Terça a sábado</span><span><MapPin size={18} /> Nonoai, RS</span></div></div><div className="hero-card"><div className="hero-card-top"><span className="hero-card-tag">STREET</span><span className="hero-card-label">BARBER SHOP</span></div><div className="hero-card-brand"><img src="/manus-storage/street-barber-logo-4k_bd58c9b0.png" alt="Logo Street Barber Shop" /></div><p className="hero-card-kicker">SEU ESTILO, SUA ASSINATURA</p><h2>Presença que<br /><em>se reconhece.</em></h2><div className="hero-card-rule"><span></span></div><div className="hero-card-stats"><div><strong>03</strong><span>barbeiros</span></div><div><strong>05</strong><span>serviços</span></div><div><strong>VIP</strong><span>community</span></div></div></div></section><section id="servicos" className="section dark-section service-section phase-two"><div className="section-head"><div><h2>O cuidado que<br /><em>seu estilo merece.</em></h2></div><p>Cinco escolhas objetivas para sair da cadeira com o visual alinhado aos seus detalhes.</p></div><div className="service-grid">{services.map((service, index) => <ServiceCard service={service} index={index} key={service.name} />)}</div></section><section id="clube" className="club-teaser phase-three"><div className="club-teaser-head"><div><h2>Mais que um corte.<br /><em>Uma comunidade.</em></h2><p>Planos pensados para quem valoriza constância, cuidado e pertencimento. Você mantém seu visual em dia e se aproxima de uma comunidade relacionada pelo mesmo estilo de vida.</p></div><div className="club-mark"><img src="/manus-storage/street-barber-logo-4k_bd58c9b0.png" alt="Logo oficial Street Barber Shop" /><span className="club-mark-signature" aria-label="Street Community"><b>STREET</b><i>COMMUNITY</i></span></div></div><div className="home-plans-section"><div className="home-plans-intro"><p className="eyebrow plans-kicker">PLANOS:</p><span className="vip-marker" role="status" aria-label="Convite para o clube VIP"><span className="vip-dot" aria-hidden="true"></span></span><h3>BEM-VINDO À<br /><em>COMUNIDADE STREET BARBER SHOP</em></h3><p>Mais do que uma barbearia. Uma comunidade de benefícios.</p><p>Torne-se um Cliente VIP Street Barber Shop e tenha acesso a benefícios exclusivos em estabelecimentos parceiros da nossa rede.</p><p>Escolha um dos nossos planos mensais e aproveite descontos, vantagens especiais e experiências exclusivas pensadas para quem faz parte da nossa comunidade.</p><p>Assine seu plano, aproveite os benefícios e faça parte da Street Barber Shop.</p></div><div className="plans-page-grid home-plans-grid">{catalog.map((plan, index) => <PlanCard plan={plan} index={index} key={plan.slug} />)}</div><p className="home-plans-note"><Sparkles size={17} /> Clique em um plano para conferir a economia, a sobrancelha de brinde, a validade de 30 dias e as especificações.</p></div></section><section id="barbeiros" className="section light barber-section phase-four"><div className="section-head"><div><h2>Três estilos.<br /><em>Uma só atitude.</em></h2></div><p>Escolha seu barbeiro e entre diretamente na conversa do assistente. Selecione quantos serviços quiser, escolha o dia e o horário.</p></div><div className="barber-grid">{barbers.map((barber) => <BarberCard barber={barber} key={barber.name} />)}</div></section><section id="contato" className="contact phase-five"><div><h2>Nos vemos<br /><em>na cadeira.</em></h2></div><div className="contact-info"><a href="https://maps.app.goo.gl/qxyhNH2j1vgX8MMP6?g_st=iw" target="_blank" rel="noreferrer"><MapPin size={20} /> Nonoai, Rio Grande do Sul</a><a href="https://instagram.com/street.barbeer.shop" target="_blank" rel="noreferrer"><Camera size={20} /> @street.barbeer.shop</a><span><Clock3 size={20} /> Terça a sábado · 09h às 20h</span></div></section></main><footer><InternalLink className="brand" href="/#inicio"><img src="/manus-storage/street-barber-logo-4k_bd58c9b0.png" alt="Street Barber Shop" /><span>STREET<small>BARBER SHOP</small></span></InternalLink><span>© 2026 Street Barber Shop</span><span>Atitude na cadeira certa.</span><InternalLink className="admin-footer-link" href="/admin">Área interna</InternalLink></footer></div> }

function PlanDetailPage({ plan }) { return <div className="app inner-page"><Header menu={false} setMenu={() => {}} /><main className="plan-detail-page"><InternalLink className="back-link" href="/planos">← Voltar para os planos</InternalLink><p className="eyebrow">STREET COMMUNITY · PLANO MENSAL</p><h1>{plan.name}<br /><em>Street Community.</em></h1><p className="page-lead">{plan.note}</p><section className="plan-detail-card"><div><span className="plan-index">PLANO STREET</span><h2>O que está incluído</h2><p>Uma rotina de cuidado com benefícios pensados para quem faz da presença um compromisso.</p></div><div className="plan-detail-price"><del>{plan.oldPrice}</del><strong>{plan.price}</strong><span>Economia de {plan.economy}</span></div><div className="plan-perks">{plan.details.map((detail) => <span key={detail}><Check size={14} /> {detail}</span>)}</div></section><InternalLink className="secondary" href="/clube"><ArrowRight size={17} /> Conhecer o clube</InternalLink></main></div> }

export default function PublicSite() { const [path, setPath] = useState(window.location.pathname); useEffect(() => { const onPopState = () => setPath(window.location.pathname); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState) }, []); if (path === '/planos') return <PlansPage />; if (path.startsWith('/planos/')) { const plan = plans.find((item) => item.slug === decodeURIComponent(path.slice('/planos/'.length))); if (plan) return <PlanDetailPage plan={plan} /> } if (path === '/clube') return <ClubPage />; const assistantMatch = path.match(/^\/assistentes\/(luan|bruno|kaua)$/); if (assistantMatch) return <AssistantPage barber={barbers.find((barber) => barber.slug === assistantMatch[1])} />; return <Home /> }



function Home() {
  const [menu, setMenu] = useState(false)
  const [watermarkLoaded, setWatermarkLoaded] = useState(false)
  const catalog = usePlanCatalog()
  return <div className="app"><Header menu={menu} setMenu={setMenu} /><main>
    <section id="inicio" className="hero phase-one"><img className={watermarkLoaded ? 'hero-watermark is-loaded' : 'hero-watermark'} src="/manus-storage/street-barber-logo-4k_4c930076.webp" alt="" aria-hidden="true" loading="eager" decoding="async" onLoad={() => setWatermarkLoaded(true)} /><div className="hero-copy"><p className="eyebrow">BARBEARIA · ESTILO · PRESENÇA</p><h1>Atitude não se<br />improvisa,<br /><em>se cultiva na<br />cadeira certa.</em></h1><p className="lead">Atendimento especializado, técnica e cuidado para entregar um visual à altura da sua identidade.</p><div className="hero-actions"><a className="primary" href="#servicos">Conhecer serviços <ArrowRight size={19} /></a><InternalLink className="secondary" href="/planos">Conhecer os planos <Sparkles size={18} /></InternalLink></div><div className="hero-meta"><span><Clock3 size={18} /> Terça a sábado</span><span><MapPin size={18} /> Nonoai, RS</span></div></div><div className="hero-card"><div className="hero-card-top"><span className="hero-card-tag">STREET</span><span className="hero-card-label">BARBER SHOP</span></div><div className="hero-card-brand"><img src="/manus-storage/street-barber-logo-4k_bd58c9b0.png" alt="Logo Street Barber Shop" /></div><p className="hero-card-kicker">SEU ESTILO, SUA ASSINATURA</p><h2>Presença que<br /><em>se reconhece.</em></h2><div className="hero-card-rule"><span></span></div><div className="hero-card-stats"><div><strong>03</strong><span>barbeiros</span></div><div><strong>05</strong><span>serviços</span></div><div><strong>VIP</strong><span>community</span></div></div></div></section>
    <section id="barbeiros" className="section light barber-section phase-two"><div className="section-head"><div><p className="eyebrow dark">CONHEÇA NOSSA EQUIPE</p><h2>Conheça nossos<br /><em>barbeiros.</em></h2></div><p>Escolha seu barbeiro e entre diretamente na conversa do assistente. Selecione quantos serviços quiser, escolha o dia e o horário.</p></div><div className="barber-grid">{barbers.map((barber) => <BarberCard barber={barber} key={barber.name} />)}</div></section>
    <section id="servicos" className="section dark-section service-section phase-three"><div className="section-head"><div><h2>O cuidado que<br /><em>seu estilo merece.</em></h2></div><p>Cinco escolhas objetivas para sair da cadeira com o visual alinhado aos seus detalhes.</p></div><div className="service-grid">{services.map((service, index) => <ServiceCard service={service} index={index} key={service.name} />)}</div></section>
    <section id="clube" className="club-teaser phase-four"><div className="club-teaser-head"><div><p className="eyebrow">STREET COMMUNITY · BENEFÍCIOS</p><h2>Conheça nossos<br /><em>planos.</em></h2><p>Planos pensados para quem valoriza constância, cuidado e pertencimento. Você mantém seu visual em dia e se aproxima de uma comunidade relacionada pelo mesmo estilo de vida.</p><a className="primary" href="#planos">Conhecer nossos planos <ArrowRight size={17} /></a></div><div className="club-mark"><img src="/manus-storage/street-barber-logo-4k_bd58c9b0.png" alt="Logo oficial Street Barber Shop" /><span className="club-mark-signature" aria-label="Street Community"><b>STREET</b><i>COMMUNITY</i></span></div></div></section>
    <section id="planos" className="section dark-section home-plans-section phase-five"><div className="home-plans-intro"><p className="eyebrow plans-kicker">PLANOS:</p><span className="vip-marker" role="status" aria-label="Convite para o clube VIP"><span className="vip-dot" aria-hidden="true"></span></span><h3>BEM-VINDO À<br /><em>COMUNIDADE STREET BARBER SHOP</em></h3><p>Mais do que uma barbearia. Uma comunidade de benefícios.</p><p>Torne-se um Cliente VIP Street Barber Shop e tenha acesso a benefícios exclusivos em estabelecimentos parceiros da nossa rede.</p><p>Escolha um dos nossos planos mensais e aproveite descontos, vantagens especiais e experiências exclusivas pensadas para quem faz parte da nossa comunidade.</p><p>Assine seu plano, aproveite os benefícios e faça parte da Street Barber Shop.</p></div><div className="plans-page-grid home-plans-grid">{catalog.map((plan, index) => <PlanCard plan={plan} index={index} key={plan.slug} />)}</div><p className="home-plans-note"><Sparkles size={17} /> Clique em um plano para conferir a economia, a sobrancelha de brinde, a validade de 30 dias e as especificações.</p></section>
    <section id="contato" className="contact phase-six"><div><p className="eyebrow">CONSIDERAÇÕES FINAIS</p><h2>Nos vemos<br /><em>na cadeira.</em></h2></div><div className="contact-info"><a href="https://maps.app.goo.gl/qxyhNH2j1vgX8MMP6?g_st=iw" target="_blank" rel="noreferrer"><MapPin size={20} /> Nonoai, Rio Grande do Sul</a><a href="https://instagram.com/street.barbeer.shop" target="_blank" rel="noreferrer"><Camera size={20} /> @street.barbeer.shop</a><span><Clock3 size={20} /> Terça a sábado · 09h às 20h</span></div></section>
  </main><footer><InternalLink className="brand" href="/#inicio"><img src="/manus-storage/street-barber-logo-4k_bd58c9b0.png" alt="Street Barber Shop" /><span>STREET<small>BARBER SHOP</small></span></InternalLink><span>© 2026 Street Barber Shop</span><span>Atitude na cadeira certa.</span><InternalLink className="admin-footer-link" href="/admin">Área interna</InternalLink></footer></div>
}
