# Bellus — Salon Management System

Full-featured salon management platform with online booking, appointment scheduling, financial tracking, AI-powered marketing, and automated WhatsApp/SMS notifications.

Built with **Next.js 16**, **React 19**, **Supabase**, and **TypeScript**.

---

## Features

### Appointment Scheduling (Agenda)
- Interactive calendar with **FullCalendar** (day/week views)
- Multi-professional scheduling with conflict detection
- Create, edit, reschedule, and cancel appointments
- Time blocking for professional unavailability
- Payment collection at appointment completion
- Automatic service duration calculation

### Public Online Booking
- Shareable booking page at `/booking/[salon-slug]`
- Multi-step wizard: service > professional > date/time > client info
- Real-time slot availability via API
- QR code generation for quick access
- No account required for clients

### Client Management (Clientes)
- Client directory with search and filters
- Individual client profiles with visit history
- Return interval tracking and reminders
- Preferred language per client (PT/ES/EN/RU)
- Contact details and notes

### Service Catalog (Servicos)
- Service definitions with duration, price, and category
- Categories: corte, coloracao, mechas, tratamento, outro
- Per-professional price overrides
- Multi-stage services (pause/drying time for color treatments)
- Return visit interval recommendations
- Active/inactive toggle

### Cash Register (Caixa)
- Daily transaction view with date navigation
- Payment methods: cash, card, Bizum, bank transfer
- Summary cards by payment method
- Transaction history with date range filters
- CSV export

### Fiscal & Tax Management (Fiscal)
- Quarterly IVA/IRPF tracking (Spanish tax system)
- Income vs. expense breakdown
- Deductible expense logging by category
- Cuota de autonomos (self-employment fee) tracking
- Modelo 303 (IVA) and Modelo 130 (IRPF) CSV export
- Fiscal deadline alerts
- Configurable tax percentages and NIF

### Marketing & AI
- AI chat assistant powered by **Claude** (Anthropic)
- Campaign management and analytics
- AI-generated marketing content (posts, emails, SMS)
- Client reactivation automation (churn prevention)
- Meta/Instagram integration

### Notifications & Reminders
- **Twilio** integration (WhatsApp + SMS)
- Customizable message templates with variables
- Scheduled cron jobs:
  - 08:00 — Appointment confirmation reminders (24h before)
  - 09:00 — Return visit reminders
  - 10:00 — AI-triggered marketing messages
  - 11:00 — Lapsed client reactivation
  - Mon 10:00 — Weekly marketing performance report
- Notification send log with status tracking
- Client opt-out support

### Dashboard & KPIs
- Time-of-day greeting
- Today's appointments overview
- Revenue summary
- Client statistics (new, returning)
- Top services by popularity

### Settings
- Salon info (name, address, phone, WhatsApp)
- Logo upload
- Brand primary color
- Currency and timezone
- Instagram and Google Maps links
- Booking QR code

### Internationalization (i18n)
- 4 languages: **Portugues**, **Espanol**, **English**, **Русский**
- Cookie-based locale persistence
- 361+ translation keys across 13 namespaces
- Language switcher in UI
- Per-client preferred language for notifications

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Next.js](https://nextjs.org) | 16.x | Framework (App Router, SSR, API Routes) |
| [React](https://react.dev) | 19.x | UI library |
| [TypeScript](https://typescriptlang.org) | 5.x | Type safety |
| [Supabase](https://supabase.com) | 2.x | PostgreSQL, Auth, RLS, Realtime |
| [Tailwind CSS](https://tailwindcss.com) | 4.x | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com) | 3.x | Accessible UI components |
| [Zustand](https://zustand.docs.pmnd.rs) | 5.x | Global state management |
| [TanStack Query](https://tanstack.com/query) | 5.x | Server state & caching |
| [next-intl](https://next-intl.dev) | 4.x | Internationalization |
| [FullCalendar](https://fullcalendar.io) | 6.x | Calendar/scheduling UI |
| [Zod](https://zod.dev) | 4.x | Schema validation |
| [Twilio](https://twilio.com) | — | SMS/WhatsApp notifications |
| [Claude API](https://docs.anthropic.com) | — | AI marketing features |
| [jsPDF](https://github.com/parallax/jsPDF) | 4.x | PDF generation |

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Supabase** project (or Supabase CLI for local dev)

### 1. Clone & Install

```bash
git clone https://github.com/rodrigoobarbosaa/bellus-salon-management.git
cd bellus-salon-management/bellus
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | Yes | Application base URL |
| `CRON_SECRET` | Yes | Random string to protect cron endpoints |
| `TWILIO_ACCOUNT_SID` | Optional | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Optional | Twilio Auth Token |
| `TWILIO_WHATSAPP_FROM` | Optional | Twilio WhatsApp sender number |
| `TWILIO_SMS_FROM` | Optional | Twilio SMS sender number |
| `ANTHROPIC_API_KEY` | Optional | Claude API key (for marketing AI) |

### 3. Database Setup

**Option A: Remote Supabase (recommended)**

Create a project at [supabase.com](https://supabase.com), then apply the schema:

```bash
# Apply full schema via Supabase SQL Editor
# Use the contents of supabase/all-migrations.sql
```

**Option B: Local Supabase**

```bash
npm install -g supabase
supabase start
supabase db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | TypeScript type validation |
| `npm run i18n:check` | Verify translation file consistency |

---

## Project Structure

```
bellus/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Auth pages (login, register, reset)
│   │   ├── (dashboard)/              # Protected dashboard area
│   │   │   └── dashboard/
│   │   │       ├── page.tsx           # Dashboard home (KPIs)
│   │   │       ├── agenda/            # Appointment scheduling
│   │   │       ├── clientes/          # Client management + [id] profile
│   │   │       ├── servicos/          # Service catalog
│   │   │       ├── caixa/             # Cash register / POS
│   │   │       ├── fiscal/            # Tax & fiscal management
│   │   │       ├── marketing/         # AI marketing suite
│   │   │       ├── notificacoes/      # Notification templates
│   │   │       └── configuracoes/     # Salon settings
│   │   ├── booking/[slug]/            # Public booking portal
│   │   ├── api/                       # API routes & cron jobs
│   │   └── actions/                   # Server actions (13 modules)
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui base components
│   │   └── shared/                    # Sidebar, header, nav, language switcher
│   │
│   ├── lib/
│   │   ├── supabase/                  # Client, server, middleware, service clients
│   │   ├── notifications/             # Twilio integration & templates
│   │   └── i18n/                      # Notification i18n helpers
│   │
│   ├── hooks/                         # useAuth, useRole
│   ├── stores/                        # Zustand (auth store)
│   ├── locales/                       # Translation files (pt, es, en, ru)
│   ├── types/                         # Supabase generated types
│   └── middleware.ts                  # Auth & routing middleware
│
├── supabase/
│   ├── all-migrations.sql             # Complete database schema
│   ├── migrations/                    # Individual migration files
│   └── seed.sql                       # Development seed data
│
├── scripts/
│   └── check-i18n.ts                  # Translation consistency checker
│
├── vercel.json                        # Deployment config & cron schedules
└── .env.example                       # Environment variables template
```

---

## Database

Bellus uses **Supabase** (PostgreSQL) with Row Level Security (RLS) enabled on all tables for multi-tenant isolation.

### Core Tables

| Table | Description |
|-------|-------------|
| `saloes` | Salon profiles (name, slug, config) |
| `usuarios` | Users linked to salons with roles |
| `profissionais` | Team members (owner or professional) |
| `clientes` | Customers with preferred language |
| `servicos` | Service catalog with pricing |
| `servicos_profissionais` | Service-professional mapping + price overrides |
| `agendamentos` | Appointments with status tracking |
| `bloqueios` | Professional time blocks |
| `transacoes` | Payment transactions |
| `despesas` | Deductible business expenses |
| `configuracoes_fiscais` | Tax configuration per salon |
| `notificacoes_log` | Notification send history |
| `notification_templates` | Custom message templates |

### Auth & Roles

| Role | Access |
|------|--------|
| `proprietario` | Full access — all pages, settings, financials |
| `profissional` | Own appointments, limited views |

---

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/booking/slots` | POST | Available time slots for public booking |
| `/api/marketing/chat` | POST | Claude AI chat conversation |
| `/api/marketing/generate` | POST | AI content generation |
| `/api/push/register` | POST | Push notification device registration |
| `/api/opt-out` | POST | Client notification opt-out |
| `/api/cron/reminders` | POST | Daily appointment reminders (8am) |
| `/api/cron/return-reminders` | POST | Daily return visit reminders (9am) |
| `/api/cron/marketing-triggers` | POST | Daily AI marketing messages (10am) |
| `/api/cron/reactivation-check` | POST | Daily churn prevention (11am) |
| `/api/cron/marketing-weekly-report` | POST | Weekly marketing report (Mon 10am) |

Cron endpoints are protected by `CRON_SECRET` header validation.

---

## Deployment

The project is configured for **Vercel** with automatic deployments on push.

```bash
# Link project (first time)
npx vercel link

# Deploy to production
npx vercel --prod
```

Configure all environment variables in the Vercel dashboard before deploying.

Cron jobs are defined in `vercel.json` and run automatically on the Vercel Hobby/Pro plan.

---

## Languages

| Code | Language | Status |
|------|----------|--------|
| `pt` | Portugues | Complete |
| `es` | Espanol | Complete (default) |
| `en` | English | Complete |
| `ru` | Русский | Complete |

Translation files: `src/locales/{lang}/common.json`

---

## License

Private project. All rights reserved.
