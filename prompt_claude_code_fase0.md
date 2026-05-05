# Claude Code — Toncan Digital · Módulo Admin + Portal Técnico · Fase 0

## Contexto del proyecto

Soy Joseph Moreno, Corporación Toncan Digital, C.A. (RIF J-31197274-9). Este repo contiene un **SaaS de Soporte QR** ya en producción construido con **Next.js + Supabase + Vercel**. Ahora vamos a **extender el mismo proyecto** agregando un módulo administrativo interno y un portal técnico de campo, **sin romper nada de lo existente**.

**NO crees un proyecto nuevo. NO dupliques Supabase. NO toques las tablas actuales del SaaS QR.** Todo va en:
- Rutas nuevas: `/admin` y `/portal`
- Schema de Postgres nuevo: `admin` (aislado del schema `public` que usa el SaaS QR)
- Buckets de Storage nuevos con prefijo propio

## Objetivo de esta sesión (Fase 0 completa)

Dejar lista la **base técnica** del módulo para que las fases siguientes (nómina, portal técnico, viáticos, cobros, dashboard) construyan encima sin fricción.

Al final de esta fase debe existir:

1. **Migrations de Supabase** en `/supabase/migrations/` que creen el schema `admin`, todas las tablas principales, RLS, triggers de auditoría y tasas de cambio.
2. **Seed data** con los 23 empleados reales y estructura inicial de roles.
3. **Middleware Next.js** que proteja `/admin` (roles admin, super_admin, contabilidad, supervisor) y `/portal` (roles tecnico, chofer, supervisor).
4. **Layouts base** de `/admin` y `/portal` (shell con sidebar/nav, sin features todavía, solo "Hola, rol: X").
5. **Helper de Supabase con roles** en `lib/admin/auth.ts`.
6. **Tabla `profiles`** vinculada a `auth.users` con campo `rol`.
7. **Seed de tasas BCV** iniciales (del formato D-5: USD=471.70, EUR=543.94).

## Reglas de ingeniería que quiero que sigas

1. **Antes de escribir una sola línea, explora el repo**: lee `package.json`, `next.config.js/ts`, la estructura de `src/app/` o `app/`, el cliente Supabase existente, cómo manejamos auth hoy, y qué librerías ya están instaladas. Resume qué encontraste antes de proponer cambios.
2. **Respeta convenciones existentes**: si el proyecto usa App Router, seguimos App Router. Si usa TypeScript, todo en TS. Si hay un patrón para server actions o API routes, lo seguimos.
3. **No instales dependencias sin avisar**: si necesitas algo nuevo, lístalas primero y espera confirmación. Para esta fase solo debería hacer falta lo que ya está.
4. **SQL idempotente**: todas las migrations con `create schema if not exists`, `create table if not exists`, `drop policy if exists` antes de crear, etc. Quiero poder re-correr sin romper.
5. **RLS activo desde el minuto 1**: cada tabla del schema `admin` nace con `alter table ... enable row level security` y al menos una política mínima. Sin excepciones.
6. **Nada de `service_role` en el cliente**. Server-only.
7. **Commits atómicos**: al final, dame una sugerencia de mensajes de commit separados por concern (migrations, middleware, layouts, seed).

## Stack confirmado

- Next.js (App Router) — respeta la versión que ya está instalada
- Supabase (Postgres + Auth + Storage) — extender el proyecto actual
- Vercel — sin cambios en deployment
- TypeScript — estricto
- Tailwind + shadcn/ui si ya están; si no, NO los agregues todavía

## Roles del sistema

```
super_admin     → Joseph (acceso total, ve audit_log)
admin           → Alexis Moreno y personal de confianza
contabilidad    → nómina, cobros, reportes financieros
supervisor      → asigna visitas, aprueba viáticos de su equipo, ve todas las visitas
tecnico         → /portal, crea visitas, registra viáticos propios
chofer          → /portal versión reducida (acompaña a técnico, viáticos propios)
```

## Modelo de datos — crear en esta fase

Crea el schema `admin` y estas tablas (todas con `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()` gestionado por trigger, y `deleted_at timestamptz null` para soft-delete donde aplique):

### 1. `admin.profiles`
Extiende `auth.users` con rol y datos operativos.
```
user_id uuid primary key references auth.users on delete cascade
nombre text not null
cedula text unique
rol text not null check (rol in ('super_admin','admin','contabilidad','supervisor','tecnico','chofer'))
telefono text
empleado_id uuid references admin.empleados(id)  -- se agrega después de crear empleados
activo boolean default true
```

### 2. `admin.empleados`
Los 23 empleados actuales (ver seed abajo).
```
cedula text unique not null
nombre_completo text not null
cta_bancaria text
banco text default '0134 Banesco'
cargo text
salario_base_usd numeric(12,2) not null
fecha_ingreso date
activo boolean default true
```

### 3. `admin.nomina_mensual`
Nómina generada por periodo (YYYY-MM).
```
empleado_id uuid references admin.empleados on delete restrict
periodo text not null  -- formato 'YYYY-MM'
salario_usd numeric(12,2) not null
prestaciones_usd numeric(12,2) not null       -- 5 días, ~17%
bono_vacacional_usd numeric(12,2) not null    -- variable, ~6%
utilidades_usd numeric(12,2) not null          -- 60 días, ~17%
total_usd numeric(12,2) generated always as (salario_usd + prestaciones_usd + bono_vacacional_usd + utilidades_usd) stored
tasa_bcv numeric(12,4) not null
total_bs numeric(14,2) generated always as ((salario_usd + prestaciones_usd + bono_vacacional_usd + utilidades_usd) * tasa_bcv) stored
pagado boolean default false
fecha_pago date
unique (empleado_id, periodo)
```

### 4. `admin.clientes`
```
rif text unique not null
razon_social text not null
atc text check (atc in ('ATC1','ATC2','ATC3'))
direccion text
contacto_nombre text
contacto_telefono text
tarifa_bn_usd numeric(10,4) default 0.04
tarifa_color_usd numeric(10,4) default 0.60
activo boolean default true
```

### 5. `admin.equipos`
```
serial text unique not null
modelo text
marca text  -- Boss, CBM, Canon, etc.
cliente_id uuid references admin.clientes
ubicacion text
estado text not null default 'inventario' check (estado in ('campo','inventario','mantenimiento','baja'))
fecha_instalacion date
qr_code text unique  -- opcional, se puede enlazar con el SaaS QR existente
```

### 6. `admin.visitas_tecnicas`
```
tecnico_id uuid not null references auth.users
acompañante_id uuid references auth.users   -- chofer u otro técnico
cliente_id uuid references admin.clientes
equipo_id uuid references admin.equipos
tipo text not null check (tipo in ('mantenimiento_preventivo','reparacion','instalacion','entrega_insumos','retiro','traslado_foraneo'))
check_in timestamptz
check_out timestamptz
lat_in numeric(10,6)
lng_in numeric(10,6)
lat_out numeric(10,6)
lng_out numeric(10,6)
notas text
firma_url text  -- storage url
status text not null default 'abierta' check (status in ('abierta','completada','revisada','cancelada'))
km_inicial integer  -- solo para traslado_foraneo
km_final integer
destino_foraneo text
```

### 7. `admin.visita_fotos`
```
visita_id uuid not null references admin.visitas_tecnicas on delete cascade
url text not null
momento text check (momento in ('antes','despues','otro'))
orden smallint default 0
```

### 8. `admin.lecturas_contador`
```
equipo_id uuid not null references admin.equipos
visita_id uuid references admin.visitas_tecnicas
fecha date not null
contador_bn integer not null
contador_color integer not null
copias_periodo_bn integer
copias_periodo_color integer
```

### 9. `admin.viaticos`
```
empleado_id uuid not null references admin.empleados
user_id uuid references auth.users  -- quien registró desde el portal
visita_id uuid references admin.visitas_tecnicas
tipo text not null check (tipo in ('gasolina','peaje','comida','hospedaje','otro'))
monto_bs numeric(14,2) not null
monto_usd numeric(12,2)
tasa_bcv numeric(12,4)
foto_url text
fecha date not null default current_date
status text not null default 'pendiente' check (status in ('pendiente','aprobado','rechazado','ajustado'))
monto_aprobado_bs numeric(14,2)
aprobado_por uuid references auth.users
aprobado_at timestamptz
nota_aprobacion text
```

### 10. `admin.cobros_mensuales`
```
cliente_id uuid not null references admin.clientes
periodo text not null
copias_bn integer default 0
copias_color integer default 0
monto_bn_usd numeric(12,2) default 0
monto_color_usd numeric(12,2) default 0
total_usd numeric(12,2) generated always as (monto_bn_usd + monto_color_usd) stored
tasa_bcv numeric(12,4)
archivo_origen text
importado_por uuid references auth.users
unique (cliente_id, periodo)
```

### 11. `admin.costos_estructura`
```
periodo text not null
categoria text not null check (categoria in ('personal','viaticos','movilizacion','dotacion','insumos','admin','utilidad','financieros','otro'))
concepto text not null
monto_usd numeric(12,2) not null
monto_eur numeric(12,2)
monto_bs numeric(14,2)
tasa_bcv numeric(12,4)
```

### 12. `admin.tasas_cambio`
```
fecha date primary key
bs_usd numeric(12,4) not null
bs_eur numeric(12,4) not null
fuente text default 'BCV' check (fuente in ('BCV','manual'))
```

### 13. `admin.audit_log`
```
user_id uuid references auth.users
tabla text not null
operacion text not null check (operacion in ('insert','update','delete'))
registro_id uuid
datos_antes jsonb
datos_despues jsonb
timestamp timestamptz default now()
```

## Triggers e infraestructura SQL

1. Función `admin.touch_updated_at()` que actualiza `updated_at` y aplicarla vía trigger en todas las tablas que tengan ese campo.
2. Función `admin.log_audit()` que escribe en `audit_log` para `empleados`, `nomina_mensual`, `viaticos` y `cobros_mensuales`.
3. Función `admin.current_user_rol()` que hace `select rol from admin.profiles where user_id = auth.uid()` — se usa en las policies.
4. Función `admin.is_admin()` → devuelve true si el rol es `super_admin`, `admin` o `contabilidad`.

## Políticas RLS (mínimo necesario en esta fase)

- **profiles**: cada usuario lee su propia fila; `admin.is_admin()` puede leer/escribir todas.
- **empleados, nomina_mensual, cobros_mensuales, costos_estructura**: solo `admin.is_admin()`.
- **clientes, equipos, tasas_cambio**: lectura para cualquier usuario autenticado con rol en `admin.profiles`; escritura solo `admin.is_admin()`.
- **visitas_tecnicas**: un técnico lee las visitas donde él es `tecnico_id` o `acompañante_id`; supervisor y `is_admin` leen todas. Inserción: técnico inserta las suyas.
- **visita_fotos, lecturas_contador**: siguen la visibilidad de `visitas_tecnicas`.
- **viaticos**: usuario lee los que insertó (`user_id = auth.uid()`); `is_admin` lee y aprueba todos.
- **audit_log**: solo `super_admin` lee; escritura solo por triggers (sin policy de insert para clientes).

## Storage buckets a crear

```
viaticos-fotos          (privado, RLS)
visitas-fotos           (privado, RLS)
firmas-clientes         (privado, RLS)
relaciones-anexas       (privado, solo admin)
recibos-pago            (privado, solo admin y el empleado dueño)
```

Política de Storage mínima: solo usuarios autenticados con perfil en `admin.profiles` pueden subir; lectura según rol. No hace falta que dejes todas las policies perfectas esta fase, pero sí los buckets creados y al menos la policy de viáticos funcional (porque se prueba en Fase 3).

## Seed de empleados (datos reales marzo 2026)

Inserta los 23 empleados en `admin.empleados`. Salarios en USD (columna SALARIOS del Excel):

```
1.  Moreno Meneses Alexis Jose      | V-4.422.394  | 0134 105777 0001003048 | 900 | Director General
2.  Prieto de Moreno Anelsy T.      | V-9.765.636  | 0134 105779 0001003050 | 900 | Directora
3.  Moreno Prieto Romario Alex      | V-21.516.025 | 0134 105775 0001003049 | 700 |
4.  Linares Ochoa Maria Eugenia     | V-11.071.274 | 0134 094551 9461239312 | 450 |
5.  Gonzalez Rodriguez Josefa       | V-12.069.847 | 0134 086612 0001262320 | 500 |
6.  Gimenez Coa Rosanyely           | V-14.869.808 | 0134 094636 0001330797 | 450 |
7.  Brett Sevilla Leandro Alfonzo   | V-20.145.273 | 0134 086615 0001215732 | 450 |
8.  Key Salgado Angelo Jose         | V-19.445.347 | 0134 037161 3711041512 | 450 |
9.  Torres Sanoja Gustavo Enrique   | V-11.561.083 | 0134 033339 3331011172 | 450 |
10. Guevara Silva Alan Isaac        | V-30.697.436 | 0134 086619 0001396411 | 400 |
11. Varela Alarcon Daniel Fernando  | V-14.680.970 | 0134 037161 3711041560 | 450 |
12. Vaamondez Guillen Alba R.       | V-19.396.799 | 0134 086615 0001402307 | 300 |
13. Romero Ravelo Nayare Irene      | V-21.534.596 | 0134 086619 0001273370 | 300 |
14. Perez Lopez Yerlimar Liseth     | V-16.556.750 | 0134 033251 3321061090 | 300 |
15. Escalona Gamez Roger Orlando    | V-14.521.877 | 0134 042321 4231050796 | 260 |
16. Granadino Danglade Luis E.      | V-22.276.162 | 0134 086610 0001235466 | 250 |
17. Camacho Rigual Luis Augusto     | V-24.914.682 | 0134 086617 0001260040 | 250 |
18. Moreno Prieto Joseph Alberto    | V-29.987.507 | 0134 037165 3711041577 | 400 |  ← soy yo, super_admin
19. Caideco Tequia Jean Carlos      | V-17.428.830 | 0134 037166 3711041571 | 260 |
20. Gatica Torres Genesis Patric.   | V-21.063.692 | 0134 086615 0001414957 | 160 |
21. Somaza Hernandez Yeefran        | V-25.023.951 | 0134 086615 0001434285 | 400 |
22. Mendez Montilla Kelvis Alfr.    | V-23.186.563 | 0134 086616 0001436075 | 400 |
23. Sierra Ramos Nancy Paola        | V-30.726.464 | 0134 086617 0001449027 | 250 |
```

Total salarios: **$9,630** (validar al final). Los cargos pueden quedar como null excepto los que conozco; yo los completo después.

## Seed de tasa BCV inicial

```sql
insert into admin.tasas_cambio (fecha, bs_usd, bs_eur, fuente)
values (current_date, 471.7000, 543.9413, 'BCV')
on conflict (fecha) do nothing;
```

## Middleware y rutas

1. Crea o extiende `middleware.ts` en la raíz:
   - Si la ruta empieza con `/admin`, verificar que el usuario esté logueado y que `admin.profiles.rol` esté en `('super_admin','admin','contabilidad','supervisor')`. Si no, redirigir a `/` o a una página `/acceso-denegado`.
   - Si la ruta empieza con `/portal`, verificar rol en `('super_admin','admin','supervisor','tecnico','chofer')`.
   - **Importante**: respeta el middleware existente del SaaS QR. Si ya existe, extiéndelo con un matcher adicional, no lo sobrescribas.

2. Crea `app/admin/layout.tsx` con un shell mínimo:
   - Sidebar con links placeholder: Dashboard, Nómina, Costos, Viáticos, Cobros, Reportes
   - Header con nombre del usuario y su rol
   - Contenido `{children}` vacío
   - Por ahora cada sub-ruta puede renderizar solo un `<h1>Sección X — en construcción</h1>`

3. Crea `app/portal/layout.tsx` con shell móvil:
   - Bottom navigation con 4 iconos: Inicio, Visitas, Viáticos, Mis equipos
   - Header compacto
   - Contenido `{children}`

4. Crea páginas placeholder para cada sub-ruta (`page.tsx` con solo un título).

## Helpers a crear

- `lib/admin/auth.ts` → función `getCurrentProfile()` server-side que retorna `{ user, profile }` con rol.
- `lib/admin/supabase-server.ts` → cliente Supabase server con cookies (si no existe ya uno en el proyecto; si existe, reutilízalo).
- `lib/admin/roles.ts` → constantes y helpers tipo `isAdmin(rol)`, `canAccessPortal(rol)`.

## Verificaciones finales antes de declarar fase 0 completa

Dame un resumen al final con:
1. Lista de archivos creados/modificados.
2. Comando exacto para correr las migrations (`supabase db push` o `supabase migration up`).
3. Query de verificación: `select count(*) from admin.empleados` debe dar 23; `select sum(salario_base_usd) from admin.empleados` debe dar 9630.
4. Cómo crear el primer usuario `super_admin` (yo, Joseph, cédula 29.987.507): pasos para crear su auth user, luego su profile apuntando a su registro de empleados.
5. Checklist de lo que QUEDÓ LISTO para Fase 1 (nómina).

## Qué NO hacer en esta fase

- No implementes nómina, viáticos, cobros ni dashboard todavía (eso va en fases siguientes).
- No generes PDFs.
- No instales Recharts, xlsx, ni @react-pdf/renderer.
- No toques el schema `public` ni las tablas del SaaS QR existente.
- No agregues notificaciones, emails ni push.

## Preguntas que puedes hacerme antes de empezar

Si encuentras algo en el repo que choca con este plan (ej: ya existe un `middleware.ts` complejo, ya hay un cliente Supabase con una convención particular, el App Router está estructurado distinto a lo que asumo), pausa y pregúntame antes de inventar una solución.

---

**Empieza por explorar el repo y darme un resumen de lo que encontraste, luego proponme el orden de archivos que vas a crear, y solo después empieza a codear.**
