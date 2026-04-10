# Toncan Digital · Sistema de Soporte QR

Aplicación web para gestión de soporte técnico de impresoras Canon iR-ADVance arrendadas a clientes corporativos. Cada máquina tiene un sticker con código QR; al escanearlo, el usuario final reporta la falla mediante un formulario y el sistema enruta la solicitud al ATC del cliente, a los técnicos asignados y a almacén según corresponda.

Repositorio: https://github.com/impresorastoncan-png/soporte-qr

## Stack

- **Next.js 16.2** (App Router · Turbopack · React 19)
- **Supabase** — PostgreSQL + Auth + Storage + Realtime
- **Resend** + **React Email** — envío de notificaciones
- **Tailwind CSS v4**
- **xlsx (SheetJS)** — importación masiva de máquinas
- **react-qr-code** — generación de QR en la vista de cada máquina
- **@react-pdf/renderer** — PDFs (stickers masivos, manual técnico)

## Estructura

```
app/
├── soporte/[serial]/          → formulario público escaneado desde QR
├── api/soporte/               → POST que crea la solicitud y dispara correo
└── admin/
    ├── login/                 → autenticación admin
    ├── live/                  → wallboard en vivo (fullscreen, realtime)
    └── (dashboard)/           → panel admin con sidebar
        ├── page.tsx           → dashboard principal
        ├── solicitudes/       → lista + filtros + drawer de detalle
        ├── clientes/          → CRUD y detalle con máquinas del cliente
        ├── almacenes/         → vista filtrada de clientes con es_almacen=true
        ├── maquinas/          → CRUD + importación Excel + QR individual
        └── tecnicos/          → CRUD
lib/
├── supabase/                  → clientes SSR/browser/service y tipos
├── email.ts                   → envío vía Resend con deduplicación
├── validations.ts             → esquemas Zod
└── utils.ts                   → helpers (ticket id, urgencias, fechas)
components/
├── admin/                     → UI primitives, Sidebar
└── email/SolicitudEmail.tsx   → template React Email
proxy.ts                       → auth middleware (Next 16 renombró middleware → proxy)
docs/                          → manual técnico y de uso
supabase_schema.md             → todas las migraciones SQL del proyecto
```

## Setup local

Requiere Node 20+.

```bash
git clone https://github.com/impresorastoncan-png/soporte-qr.git
cd soporte-qr
npm install
npm run dev
```

### Variables de entorno

Crear `.env.local` en la raíz con:

```ini
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

RESEND_API_KEY=re_...
EMAIL_FROM=Toncan Digital Soporte <onboarding@resend.dev>
EMAIL_ATC=impresorastoncan@gmail.com
EMAIL_ALMACEN=impresorastoncan@gmail.com
EMAIL_GERENTE_TEC=impresorastoncan@gmail.com
```

### Base de datos

Todas las migraciones están documentadas y ordenadas en `supabase_schema.md`. Correr en Supabase SQL Editor:

1. §1 a §10 — esquema base (tablas, RLS, view `v_maquinas_detalle`)
2. §11 — datos de prueba (opcional, para modo sandbox con Resend)
3. §12 — migración de almacenes (flag `es_almacen` + CTD QTA y CTD L4)
4. §13 — habilitar Realtime en tabla `solicitudes` para el wallboard

## Scripts

```bash
npm run dev         # dev server con Turbopack
npm run build       # build de producción
npm start           # servir el build
npm run lint        # ESLint
```

## Deployment (Vercel)

1. **Subir a GitHub** (este repo ya está listo).
2. **New Project** en vercel.com → importar el repo.
3. **Environment Variables** — copiar todas las de `.env.local` excepto `NEXT_PUBLIC_APP_URL`.
4. **Deploy** — Vercel entrega una URL tipo `soporte-qr-xxx.vercel.app`.
5. **Agregar `NEXT_PUBLIC_APP_URL`** con la URL del deploy → **Redeploy** (para que los QRs apunten a producción y no a localhost).

Para producción real:
- Verificar el dominio `toncandigital.com` en Resend y cambiar `EMAIL_FROM` a `soporte@toncandigital.com` para poder enviar a direcciones reales.
- Apuntar un dominio custom (ej. `soporte.toncandigital.com`) al proyecto Vercel y actualizar `NEXT_PUBLIC_APP_URL`.

## Rutas principales

| Ruta | Descripción |
|---|---|
| `/soporte/[serial]` | Formulario público que se abre al escanear el QR |
| `/api/soporte` | POST que registra la solicitud y envía el correo |
| `/admin/login` | Login del panel administrativo |
| `/admin` | Dashboard con métricas del día |
| `/admin/solicitudes` | Lista filtrable con drawer de detalle |
| `/admin/live` | Wallboard fullscreen en tiempo real |
| `/admin/clientes` | CRUD de clientes |
| `/admin/almacenes` | CTD QTA y CTD L4 (equipos no asignados) |
| `/admin/maquinas` | CRUD de máquinas + QR individual |
| `/admin/clientes/[id]/importar` | Importación masiva desde Excel |

## Generar el manual en PDF

El manual técnico y la guía de uso están en `docs/MANUAL.md`. Para regenerar el PDF:

```bash
node scripts/generate-manual-pdf.mjs
```

El archivo resultante queda en `docs/manual-toncan-qr.pdf`.

## Licencia

Uso interno de Corporación Toncan Digital, C.A.
