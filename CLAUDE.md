# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this app does

Field-service management for Canon iR-ADVance printers leased to corporate clients. Each printer has a QR sticker; scanning it opens `/soporte/[serial]` where the end user submits a fault report. The request is saved to Supabase and emails are sent to ATC, technicians, warehouse, and support teams via Resend.

## Commands

```bash
npm run dev     # dev server with Turbopack
npm run build   # production build
npm start       # serve production build
npm run lint    # ESLint
```

Requires Node 20+. No test runner is configured.

## Environment variables (.env.local)

```ini
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

RESEND_API_KEY=re_...
EMAIL_FROM=Toncan Digital <noreply@toncandigital.com>
EMAIL_ALMACEN=almacen@toncandigital.com
EMAIL_SOPORTE=soporte@toncandigital.com
```

`NEXT_PUBLIC_APP_URL` must be updated after deploying to Vercel so QR codes point to the correct domain.

## Architecture

### Supabase client tiers

Three client types in `lib/supabase/server.ts` — use the right one:

| Client | Function | Use when |
|--------|----------|----------|
| SSR | `createSSRClient()` | Admin routes; reads session cookies, respects RLS |
| Anon | `createAnonClient()` | Public routes; anon key, respects RLS |
| Service | `createServiceClient()` | Server actions that must bypass RLS (inserts, admin writes) |

### Auth middleware

`proxy.ts` at the root is the Next.js auth middleware (Next 16 renamed `middleware.ts` → `proxy.ts`). It refreshes Supabase session cookies and protects `/admin` routes.

### Public form flow

`/soporte/[serial]` → user fills form → POST `/api/soporte` → Zod validates (`lib/validations.ts`) → insert into `solicitudes` using service client → `sendSolicitudEmail()` sends to deduplicated recipient list via Resend.

### Email recipient logic (`lib/email.ts`)

Recipients are assembled with a `Set<string>` to avoid duplicates:
- `cliente.atc_email` (always)
- `cliente.email_fijo` (if set)
- All active technicians assigned to the machine (`maquina_tecnicos` join)
- `maquina.encargado_email` (if set)
- `EMAIL_ALMACEN` and `EMAIL_SOPORTE` env vars (always)
- `correo_solicitante` goes to CC only

### Database tables

| Table | Purpose |
|-------|---------|
| `clientes` | Clients; `atc_email`, `email_fijo`, `es_almacen` flag |
| `maquinas` | Machines; `serial` is the QR identifier, `cliente_id` FK |
| `maquina_tecnicos` | Many-to-many junction: machines ↔ technicians |
| `tecnicos` | Technicians with `email` |
| `solicitudes` | Support tickets; `urgencia` enum (baja/media/alta/critica), `estado` enum (pendiente/en_proceso/resuelto) |
| `v_maquinas_detalle` | View joining machines + clients + aggregated technicians |

All SQL migrations are in `supabase_schema.md` (§1–§13), to be run in Supabase SQL Editor.

### Key domain types

- `Urgencia` = `'baja' | 'media' | 'alta' | 'critica'`
- `EstadoSolicitud` = `'pendiente' | 'en_proceso' | 'resuelto'`
- Urgency display config (color, emoji, label) lives in `lib/utils.ts` → `urgenciaConfig`

### Admin dashboard

Protected layout under `app/admin/(dashboard)/`. Uses Supabase Realtime for the `/admin/live` wallboard. Server Actions for CRUD are colocated as `actions.ts` next to the page files.

### Almacenes

Clients flagged `es_almacen = true` represent Toncan's own storage locations. `/admin/almacenes` is a filtered view of clients with that flag — not a separate entity.

### QR / stickers

`react-qr-code` generates QR codes in the browser. `@react-pdf/renderer` generates printable sticker PDFs. Individual and bulk-print flows live under `app/admin/(dashboard)/maquinas/`.

### Email template

`components/email/SolicitudEmail.tsx` uses `@react-email/components`. Rendered server-side with `render()` from `react-email` before passing HTML to `resend.emails.send()`.
