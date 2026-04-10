# PROMPT — Toncan Digital · Sistema de Soporte QR
## Para Claude Code · Next.js + Supabase + Vercel + Resend

---

## CREDENCIALES DEL PROYECTO

> ⚠️ Completar antes de correr: pegar las keys de Supabase desde Settings → API

```env
NEXT_PUBLIC_SUPABASE_URL=https://oesfledeibzjyodyimgt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc2ZsZWRlaWJ6anlvZHlpbWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjY1MzUsImV4cCI6MjA5MTQwMjUzNX0.K0YGgfCRb9mdncCQ8e8Z3HSQGMD1nW6q51_8lF8Fkhk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc2ZsZWRlaWJ6anlvZHlpbWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyNjUzNSwiZXhwIjoyMDkxNDAyNTM1fQ.KDe_cb6cz3p2PLCefRsnk2auMi0SCaebsV2kKSTBw80
RESEND_API_KEY=re_McfNTwP6_9nhG2pBjkEbgWvKfkPW85F6D
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Toncan Digital · Soporte
EMAIL_ALMACEN=almacen@toncandigital.com
EMAIL_GERENTE_TEC=gerentetec@toncandigital.com
EMAIL_SOPORTE=gerenciaatc@toncandigital.com
EMAIL_FROM=soporte@toncandigital.com
```

---

## CONTEXTO DE NEGOCIO

**Corporación Toncan Digital, C.A.** (RIF: J-31197274-9) es una empresa venezolana de alquiler de impresoras Canon iR-ADVance. Tienen ~350 máquinas distribuidas entre múltiples clientes corporativos. Cada máquina tiene un sticker QR físico pegado. Cuando un empleado del cliente escanea el QR, debe poder reportar una falla o solicitar insumos (tóner). El sistema notifica automáticamente por correo a los responsables de Toncan.

**Contacto:** toncandigital.com · (0212) 735-1960/1961 · @TONCANCANON
**Instagram:** @TONCANCANON

---

## OBJETIVO

Construir una **web app de producción** que reemplace el sistema actual basado en Google Apps Script + Google Forms + Google Sheets. El nuevo sistema debe ser más robusto, escalable y sin las limitaciones de GAS (límite de 20 triggers, timeouts, etc.).

---

## TECH STACK (no negociable)

- **Frontend + API Routes:** Next.js 14+ (App Router)
- **Base de datos:** Supabase (PostgreSQL) con Row Level Security
- **Deploy:** Vercel
- **Emails:** Resend (con React Email para templates)
- **Estilos:** Tailwind CSS
- **Autenticación admin:** Supabase Auth (email + password)
- **QR codes:** librería `qrcode` o `react-qr-code`
- **PDF stickers:** `@react-pdf/renderer`
- **Lenguaje:** TypeScript estricto en todo

---

## ESTRUCTURA DE LA APLICACIÓN

### Rutas públicas (sin auth)
```
/soporte/[serial]          → Formulario de soporte para esa máquina
/soporte/[serial]/gracias  → Confirmación de envío
```

### Rutas de admin (requieren auth)
```
/admin                     → Dashboard principal
/admin/clientes            → Lista de clientes
/admin/clientes/[id]       → Detalle de cliente (sus máquinas)
/admin/clientes/nuevo      → Crear cliente
/admin/maquinas            → Todas las máquinas
/admin/maquinas/[serial]   → Detalle de máquina (historial de solicitudes)
/admin/solicitudes         → Todas las solicitudes recientes
/admin/tecnicos            → Gestión de técnicos
/admin/stickers            → Generador de stickers PDF
```

---

## SCHEMA DE BASE DE DATOS

Ver archivo `supabase_schema.md` para el SQL completo.

### Tablas principales:

**`clientes`**
- id (uuid, PK)
- nombre (text, único) — ej: "Bolipuerto Sede"
- rif (text) — ej: "J-12345678-9"
- direccion (text, nullable)
- atc_email (text) — correo del ATC de Toncan asignado a este cliente
- activo (boolean, default true)
- created_at

**`tecnicos`**
- id (uuid, PK)
- nombre (text)
- email (text, único) — ej: "tec1@toncandigital.com"
- activo (boolean, default true)

**`maquinas`**
- id (uuid, PK)
- serial (text, único, NOT NULL) — clave natural, lo que va en el QR
- modelo (text) — ej: "iR-ADV 4535i"
- cliente_id (uuid, FK → clientes)
- ubicacion (text) — ej: "Auditoria P2"
- encargado_email (text, nullable) — correo del responsable en el cliente
- activo (boolean, default true)
- created_at
- updated_at

**`maquina_tecnicos`** (relación M:N)
- maquina_id (uuid, FK → maquinas)
- tecnico_id (uuid, FK → tecnicos)
- PRIMARY KEY (maquina_id, tecnico_id)

**`solicitudes`**
- id (uuid, PK)
- serial (text) — snapshot del serial al momento del envío
- maquina_id (uuid, FK → maquinas, nullable — por si la máquina se elimina)
- cliente_nombre (text) — snapshot
- modelo (text) — snapshot
- ubicacion (text) — snapshot
- urgencia (text) — 'baja' | 'media' | 'alta' | 'critica'
- necesita_toner (boolean)
- tipo_problema (text, nullable)
- descripcion (text)
- nombre_solicitante (text)
- correo_solicitante (text, nullable)
- fotos_urls (text[], nullable) — URLs de Supabase Storage
- estado (text, default 'pendiente') — 'pendiente' | 'en_proceso' | 'resuelto'
- created_at

---

## FORMULARIO DE SOPORTE (`/soporte/[serial]`)

### Comportamiento:
1. Se carga el `serial` de la URL
2. Se busca en BD: si no existe o está inactivo → mostrar página de error elegante
3. Si existe → mostrar el formulario con los datos de la máquina preloaded (no editables por el usuario)

### Campos del formulario:
- **Nombre del solicitante** (text, requerido)
- **Correo del solicitante** (email, opcional — "Si lo ingresas recibirás copia de la notificación")
- **Nivel de urgencia** (radio/select, requerido):
  - 🟢 Baja — Puede esperar
  - 🟡 Media — Esta semana
  - 🟠 Alta — Hoy
  - 🔴 Crítica — Urgente, afecta operaciones
- **¿Necesita tóner?** (radio, requerido): Sí / No
- **Tipo de problema** (select, opcional):
  - Atasco de papel
  - Error en pantalla / código de error
  - Calidad de impresión deficiente
  - La máquina no enciende
  - No imprime / no responde
  - Ruido inusual
  - Problema con escáner
  - Problema con fax
  - Solicitud de mantenimiento preventivo
  - Otro
- **Descripción del problema** (textarea, requerido)
- **Fotos** (file upload, máx 3 imágenes, opcional) → subir a Supabase Storage en bucket `solicitudes-fotos`

### Al enviar:
1. Validar con Zod server-side
2. Subir fotos a Supabase Storage si las hay
3. Insertar solicitud en BD
4. Llamar a la función de envío de emails
5. Redirigir a `/soporte/[serial]/gracias`

---

## DISEÑO DEL FORMULARIO PÚBLICO

El formulario debe tener un diseño **profesional y limpio**, con la identidad de Toncan Digital:

**Colores:**
- Navy: `#162f52`
- Verde oscuro: `#295536`
- Granate: `#73262f`
- Blanco: `#ffffff`

**Header del formulario:**
- Logo de Toncan Digital (SVG, archivo en `/public/logo.svg`)
- Título: "Solicitud de Soporte Técnico"
- Subtítulo: nombre del cliente

**Info de máquina (read-only, antes del form):**
- Modelo | Serial | Ubicación — mostrado en tarjeta gris claro

**Footer:**
- "Para más información: gerenciaatc@toncandigital.com · (0212) 735 1960/1961"

---

## SISTEMA DE NOTIFICACIONES POR EMAIL

### Destinatarios (en orden):
1. **ATC del cliente** — `cliente.atc_email`
2. **Técnico(s) asignados** — `maquina_tecnicos → tecnicos.email`
3. **Encargado del equipo** — `maquina.encargado_email` (si existe)
4. **Almacén** — `almacen@toncandigital.com` (siempre)
5. **Gerente técnico** — `gerentetec@toncandigital.com` (siempre)
6. **Solicitante** — `solicitud.correo_solicitante` (si lo ingresó)

### Template del email (React Email):

El diseño debe replicar y mejorar este esquema aprobado:

```
┌─────────────────────────────────────────────┐
│  [barra verde superior]                      │
│                                              │
│  [Logo Toncan Digital centrado]              │
│  Solicitud de Insumos y Servicios            │
│  Notificaciones del cliente                  │
│  TKT-XXXXXX · dd/mm/yyyy HH:mm              │
│                                              │
│  ┌─────────────────────────────────────────┐│
│  │ [BANDA DE COLOR según urgencia]         ││
│  │ 🔴 URGENCIA: CRÍTICA                   ││
│  ├──────────────┬──────────────────────────┤│
│  │ CLIENTE      │ Nombre del cliente        ││
│  │ UBICACIÓN    │ Piso 3 · Administración   ││
│  │ MODELO       │ iR-ADV C5540             ││
│  │ SERIAL       │ XLJ04170                 ││
│  │ TÉCNICO(S)   │ tec1@toncandigital.com   ││
│  │ [ENCARGADO]  │ encargado@cliente.com    ││  ← solo si existe
│  │ [CORREO SOL] │ solicitante@email.com    ││  ← solo si ingresó
│  │ TÓNER        │ ⚠️ SÍ — Requiere tóner  ││  ← destacado en rojo si sí
│  │ [TIPO PROB]  │ Atasco de papel          ││  ← solo si seleccionó
│  ├──────────────┴──────────────────────────┤│
│  │ Falla Reportada                         ││
│  │ [descripción del problema]              ││
│  ├─────────────────────────────────────────┤│
│  │ [Fotos adjuntas como imágenes inline]   ││  ← si las subió
│  └─────────────────────────────────────────┘│
│                                              │
│  ┌ · · · · · · · · · · · · · · · · · · · ┐  │
│  │ En caso de necesitar más información:   │  │
│  │ gerenciaatc@toncandigital.com           │  │
│  └ · · · · · · · · · · · · · · · · · · · ┘  │
│                                              │
│  [barra roja inferior]                       │
└─────────────────────────────────────────────┘
```

**Colores de urgencia para la banda:**
- Crítica: `#CC0000`
- Alta: `#e67e22`
- Media: `#f39c12`
- Baja: `#009933`

**ID de ticket:** `TKT-` + 6 últimos dígitos del timestamp Unix.

**Asunto del email:**
```
[urgencia emoji] [TKT-XXXXXX] iR-ADV 4535i · Bolipuerto Sede · ⚠️ TÓNER
```

---

## DASHBOARD DE ADMIN

### `/admin` — Dashboard principal
- Métricas: total máquinas activas, solicitudes hoy, solicitudes esta semana, solicitudes pendientes
- Lista de últimas 10 solicitudes con estado (badge color: pendiente=amarillo, en_proceso=azul, resuelto=verde)
- Acceso rápido a crear cliente / máquina

### `/admin/clientes/[id]` — Detalle de cliente
- Info del cliente (nombre, RIF, ATC asignado)
- Tabla de máquinas del cliente con columnas: Modelo, Serial, Ubicación, Técnico(s), Encargado, Estado, Acciones
- Botón "Agregar máquina"
- Botón "Generar stickers PDF" (para todas las máquinas de ese cliente)

### `/admin/maquinas/[serial]` — Detalle de máquina
- Info de la máquina
- Botón "Ver QR" / "Descargar QR"
- Historial completo de solicitudes de esa máquina en tabla

### `/admin/solicitudes` — Lista de solicitudes
- Filtros por: cliente, urgencia, estado, fecha, necesita tóner
- Tabla paginada
- Click en solicitud → modal con detalle completo + fotos

### `/admin/stickers` — Generador de PDF
- Select de cliente
- Preview de los stickers
- Botón "Descargar PDF"

---

## STICKER DESIGN

Cada sticker tiene estas dimensiones: **96mm × 55mm** (para 10 stickers por A4 en grid 2×5 con márgenes de 18mm).

**Diseño del sticker** (igual al diseño aprobado en producción):

```
┌──────────────────────────────────────────────────────┐
│ [barra verde superior 5px]                           │
├─────────────────────────────────┬────────────────────┤
│ [Logo blanco sobre navy]        │ QR CODE            │
│ TONCAN DIGITAL, C.A.            │ ┌──────────────┐   │
│ J-31197274-9 · toncandigital.com│ │  [QR 66x66]  │   │
├─────────────────────────────────┤ │              │   │
│ PROPIEDAD DE: [badge verde]     │ └──────────────┘   │
│                                 │ ESCANEE PARA       │
│ Modelo:  iR-ADV 4535i           │ SOPORTE TÉCNICO    │
│ Serial:  XWH04309 (monospace)   │ [serial pequeño]   │
│ 📍 Cliente · Ubicación          │                    │
├─────────────────────────────────┴────────────────────┤
│ ▸ (0212) 735 1960/1961  ▸ @TONCANCANON               │
│ [barra roja inferior 3px]                            │
└──────────────────────────────────────────────────────┘
```

La URL del QR es: `https://[dominio-vercel]/soporte/[SERIAL]`

---

## VARIABLES DE ENTORNO NECESARIAS

```env
NEXT_PUBLIC_SUPABASE_URL=https://oesfledeibzjyodyimgt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc2ZsZWRlaWJ6anlvZHlpbWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjY1MzUsImV4cCI6MjA5MTQwMjUzNX0.K0YGgfCRb9mdncCQ8e8Z3HSQGMD1nW6q51_8lF8Fkhk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc2ZsZWRlaWJ6anlvZHlpbWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyNjUzNSwiZXhwIjoyMDkxNDAyNTM1fQ.KDe_cb6cz3p2PLCefRsnk2auMi0SCaebsV2kKSTBw80
RESEND_API_KEY=re_McfNTwP6_9nhG2pBjkEbgWvKfkPW85F6D
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Toncan Digital · Soporte
EMAIL_ALMACEN=almacen@toncandigital.com
EMAIL_GERENTE_TEC=gerentetec@toncandigital.com
EMAIL_SOPORTE=gerenciaatc@toncandigital.com
EMAIL_FROM=soporte@toncandigital.com
```

---

## ESTRUCTURA DE ARCHIVOS SUGERIDA

```
/
├── app/
│   ├── soporte/
│   │   └── [serial]/
│   │       ├── page.tsx          ← formulario público
│   │       └── gracias/
│   │           └── page.tsx      ← confirmación
│   ├── admin/
│   │   ├── layout.tsx            ← layout con sidebar + auth guard
│   │   ├── page.tsx              ← dashboard
│   │   ├── clientes/
│   │   │   ├── page.tsx
│   │   │   ├── nuevo/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── maquinas/
│   │   │   ├── page.tsx
│   │   │   └── [serial]/page.tsx
│   │   ├── solicitudes/
│   │   │   └── page.tsx
│   │   ├── tecnicos/
│   │   │   └── page.tsx
│   │   └── stickers/
│   │       └── page.tsx
│   └── api/
│       └── soporte/
│           └── route.ts          ← POST: procesar solicitud + enviar emails
├── components/
│   ├── email/
│   │   └── SolicitudEmail.tsx    ← React Email template
│   ├── stickers/
│   │   └── StickerPDF.tsx        ← @react-pdf/renderer template
│   ├── admin/
│   │   ├── Sidebar.tsx
│   │   └── ...
│   └── ui/                       ← componentes reutilizables
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts              ← tipos generados del schema
│   ├── email.ts                  ← función sendSolicitudEmail()
│   ├── validations.ts            ← schemas Zod
│   └── utils.ts
├── public/
│   └── logo.svg                  ← logo Toncan Digital
└── supabase_schema.md            ← SQL para correr en Supabase
```

---

## ORDEN DE CONSTRUCCIÓN (prioridad)

1. **Setup** — Next.js, Supabase, Tailwind, Resend, TypeScript config
2. **Schema SQL** — crear tablas, RLS, índices (ver `supabase_schema.md`)
3. **Tipos TS** — generar tipos desde Supabase o definir manualmente
4. **Formulario público** `/soporte/[serial]` — la funcionalidad core
5. **API route** `POST /api/soporte` — validación, BD, emails
6. **Email template** — React Email con el diseño aprobado
7. **Auth admin** — login con Supabase Auth
8. **Dashboard** — CRUD de clientes, máquinas, técnicos
9. **Solicitudes** — listado con filtros
10. **Generador de stickers PDF**

---

## NOTAS IMPORTANTES

- **El serial es la clave pública permanente.** El QR apunta a `/soporte/[serial]` y nunca debe cambiar aunque la máquina cambie de cliente o modelo.
- Las fotos del formulario deben subirse a Supabase Storage en el bucket `solicitudes-fotos` con la ruta `[serial]/[timestamp]-[index].[ext]`.
- Las fotos deben incluirse **inline** en el email como imágenes (URLs públicas de Supabase Storage), no como adjuntos.
- El admin dashboard debe ser **responsive** pero está pensado principalmente para desktop.
- Toda la app está en **español venezolano** (sin "vos", con "usted" en comunicaciones formales).
- Los emails se envían con **Resend**, no con Nodemailer ni SMTP directo.
- Usar **Server Actions o API Routes**, no client-side fetch para operaciones sensibles.
- El logo SVG de Toncan Digital es el archivo `/public/logo.svg` — en el sticker y en la barra navy del email debe aparecer en blanco (CSS `filter: invert(1) brightness(2)` o SVG con fill white).
