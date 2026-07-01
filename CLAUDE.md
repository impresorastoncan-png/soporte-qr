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

All of these must also be set in **Vercel → Settings → Environment Variables**.

**Critical:** `EMAIL_FROM` must use a verified domain address (e.g. `noreply@toncandigital.com`), never `onboarding@resend.dev`. Resend restricts the `onboarding@resend.dev` sender to only deliver to the account owner's email — all other recipients get a 403 `validation_error` silently swallowed by the API route.

`NEXT_PUBLIC_APP_URL` must be set to the production Vercel URL (not localhost) so QR codes point to the correct domain.

## Architecture

### Supabase client tiers

Four client types — use the right one:

| Client | Function | File | Use when |
|--------|----------|------|----------|
| SSR | `createSSRClient()` | `lib/supabase/server.ts` | Admin routes; reads session cookies, respects RLS on `public` schema |
| Anon | `createAnonClient()` | `lib/supabase/server.ts` | Public routes; anon key, respects RLS on `public` schema |
| Service | `createServiceClient()` | `lib/supabase/server.ts` | Server actions that must bypass RLS (inserts, admin writes) |
| Admin SSR | `createAdminSSRClient()` | `lib/admin/supabase-admin.ts` | Targets the `admin` Supabase schema (employees, payroll, billing); uses cookie session, respects RLS |

The project uses **two Supabase schemas**: `public` (QR/support tickets) and `admin` (HR, billing, counters). Server actions that span both schemas must call both clients.

### Auth middleware

`proxy.ts` at the root is the Next.js auth middleware (Next 16 renamed `middleware.ts` → `proxy.ts`). It refreshes Supabase session cookies and protects `/admin` and `/portal` routes.

### Role-based access control

Roles are defined in `lib/admin/roles.ts`. Each authenticated user has a `profiles` row in the `admin` schema.

| Role | `/admin` access | `/portal` access |
|------|-----------------|-----------------|
| `super_admin` | ✓ | ✓ |
| `admin` | ✓ | ✓ |
| `contabilidad` | ✓ | — |
| `supervisor` | ✓ (read-like) | ✓ |
| `tecnico` | — | ✓ |
| `chofer` | — | ✓ |

`getCurrentProfile()` (`lib/admin/auth.ts`) is the server-side helper used by both layout guards. Users with no `profiles` row (legacy SaaS accounts) are allowed through `/admin` without role enforcement.

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

**`public` schema** (QR/support domain):

| Table | Purpose |
|-------|---------|
| `clientes` | Clients; `atc_email`, `email_fijo`, `es_almacen` flag, `copiado_minimo`, `tarifa_fija_usd` (billing floor) |
| `maquinas` | Machines; `serial` is the QR identifier, `cliente_id` FK |
| `maquina_tecnicos` | Many-to-many junction: machines ↔ technicians |
| `tecnicos` | Technicians with `email` |
| `solicitudes` | Support tickets; `urgencia` enum (baja/media/alta/critica), `estado` enum (pendiente/en_proceso/resuelto), `contador` (copy count at time of report) |
| `visitas_tecnicas` | Field visit log; one row per technician per ticket; tracks `hora_llegada`, `foto_llegada_url`, `descripcion_falla`, `descripcion_solucion`, `firma_cliente_data` (base64 PNG), `nombre_firmante`, `hora_cierre` |
| `v_maquinas_detalle` | View joining machines + clients + aggregated technicians |

**`admin` schema** (HR, billing, counters — accessed only via `createAdminSSRClient()`):

| Table | Purpose |
|-------|---------|
| `profiles` | User role mapping; `user_id` FK to Supabase auth, `rol` enum |
| `empleados` | Employees with `salario_base_usd`, `activo` |
| `equipos` | Equipment inventory with `estado` (campo / inventario) |
| `tasas_cambio` | BCV exchange rates; `bs_usd`, `bs_eur`, `fecha` — shown in admin header |
| `cobros_mensuales` | Monthly billing per client; `periodo` (YYYY-MM), `copias_bn/color`, `total_usd`, `estado_relacion` (pendiente/proforma/listo), `aplica_minimo` |
| `lecturas_contador` | Counter reading history per machine per period |

Supabase Storage bucket `visitas-fotos` holds arrival photos uploaded by technicians; signed URLs (1-year TTL) are stored in `visitas_tecnicas.foto_llegada_url`.

All SQL migrations are in `supabase_schema.md` (§1–§13), to be run in Supabase SQL Editor.

### Key domain types

- `Urgencia` = `'baja' | 'media' | 'alta' | 'critica'`
- `EstadoSolicitud` = `'pendiente' | 'en_proceso' | 'resuelto'`
- Urgency display config (color, emoji, label) lives in `lib/utils.ts` → `urgenciaConfig`

### Admin dashboard

Protected layout under `app/admin/(dashboard)/`. Uses Supabase Realtime for the `/admin/live` wallboard. Server Actions for CRUD are colocated as `actions.ts` next to the page files.

`/admin/reportes` is gated by a numeric PIN verified via `POST /api/admin/verify-pin`; the unlocked state is stored in `sessionStorage` under key `toncan_reportes_unlocked`. The `PinGate` client component renders a blurred fallback when locked.

### Contadores / billing

`/admin/contadores/[clienteId]` handles per-client counter imports and monthly billing. `importarContadores()` (`app/admin/(dashboard)/contadores/actions.ts`) crosses both schemas:
- Creates/updates machines in `public.maquinas` by serial
- Inserts reading history into `admin.lecturas_contador`
- Upserts billing record into `admin.cobros_mensuales`, applying `copiado_minimo`/`tarifa_fija_usd` from `public.clientes` when actual copies fall below the minimum

### Technician field board (`/tecnicos`)

`/tecnicos` is a **public, unauthenticated** mobile board for field technicians. No session required — identity is selected at login and stored in `localStorage` under key `toncan_tecnico` (`{ id, nombre }`). The board shows pending/in-progress tickets; technicians "claim" a ticket, which creates a `visitas_tecnicas` row and transitions the `solicitudes.estado` to `en_proceso`.

Visit flow: `reclamar` → `iniciar` (arrival photo upload) → `completar` (falla + solucion + digital signature). Each action POSTs to `/api/tecnicos/visita`. On completion the `solicitudes.estado` becomes `resuelto`.

**Do not guard `/tecnicos` with Supabase auth middleware.** It is intentionally public.

### Admin metrics (`/admin/metricas`)

`/admin/metricas` is a server-rendered dashboard that reads from `visitas_tecnicas` and `solicitudes` to compute average response/resolution times per technician, resolved tickets by urgency, and visits per month per technician. Charts use `recharts` client components (`components/admin/metricas/`).

### Portal (field staff)

`/portal` is a mobile-first layout (`app/portal/`) for technicians and drivers, guarded by `canAccessPortal()`. Uses a sticky header + bottom nav (`PortalBottomNav`). The portal is currently under construction.

### Almacenes

Clients flagged `es_almacen = true` represent Toncan's own storage locations. `/admin/almacenes` is a filtered view of clients with that flag — not a separate entity.

### QR / stickers

`react-qr-code` generates QR codes in the browser. `@react-pdf/renderer` generates printable sticker PDFs. Individual and bulk-print flows live under `app/admin/(dashboard)/maquinas/`.

### Email template

`components/email/SolicitudEmail.tsx` uses `@react-email/components`. Rendered server-side with `render()` from `react-email` before passing HTML to `resend.emails.send()`.
