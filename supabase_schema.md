# Supabase Schema — Toncan Digital · Sistema de Soporte QR

Ejecutar este SQL en el editor de Supabase (**SQL Editor → New Query**).
Ejecutar en orden: primero las tablas base, luego las dependientes.

---

## 1. Extensiones

```sql
-- Habilitar UUID
create extension if not exists "uuid-ossp";
```

---

## 2. Tabla: tecnicos

```sql
create table public.tecnicos (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  email       text not null unique,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.tecnicos is 'Técnicos de Toncan Digital asignables a máquinas';

-- Índice
create index idx_tecnicos_email on public.tecnicos(email);
create index idx_tecnicos_activo on public.tecnicos(activo);
```

---

## 3. Tabla: clientes

```sql
create table public.clientes (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null unique,
  rif         text,
  direccion   text,
  atc_email   text not null,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.clientes is 'Clientes corporativos con máquinas arrendadas';

-- Índices
create index idx_clientes_nombre  on public.clientes(nombre);
create index idx_clientes_activo  on public.clientes(activo);

-- Trigger para updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_clientes_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();
```

---

## 4. Tabla: maquinas

```sql
create table public.maquinas (
  id               uuid primary key default uuid_generate_v4(),
  serial           text not null unique,
  modelo           text not null,
  cliente_id       uuid not null references public.clientes(id) on delete restrict,
  ubicacion        text not null default '',
  encargado_email  text,
  activo           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.maquinas is 'Impresoras arrendadas. serial es la clave permanente del QR.';

-- Índices
create index idx_maquinas_serial      on public.maquinas(serial);
create index idx_maquinas_cliente_id  on public.maquinas(cliente_id);
create index idx_maquinas_activo      on public.maquinas(activo);

-- Trigger para updated_at
create trigger trg_maquinas_updated_at
  before update on public.maquinas
  for each row execute function public.set_updated_at();
```

---

## 5. Tabla: maquina_tecnicos (M:N)

```sql
create table public.maquina_tecnicos (
  maquina_id   uuid not null references public.maquinas(id)  on delete cascade,
  tecnico_id   uuid not null references public.tecnicos(id) on delete cascade,
  primary key (maquina_id, tecnico_id)
);

comment on table public.maquina_tecnicos is 'Relación máquina ↔ técnicos asignados (M:N)';

create index idx_maquina_tecnicos_tecnico on public.maquina_tecnicos(tecnico_id);
```

---

## 6. Tabla: solicitudes

```sql
create table public.solicitudes (
  id                  uuid primary key default uuid_generate_v4(),
  -- Referencias (snapshot para que queden aunque se elimine la máquina)
  maquina_id          uuid references public.maquinas(id) on delete set null,
  serial              text not null,
  cliente_nombre      text not null,
  modelo              text not null,
  ubicacion           text not null,
  -- Datos del formulario
  nombre_solicitante  text not null,
  correo_solicitante  text,
  urgencia            text not null check (urgencia in ('baja','media','alta','critica')),
  necesita_toner      boolean not null default false,
  tipo_problema       text,
  descripcion         text not null,
  fotos_urls          text[],
  -- Gestión
  estado              text not null default 'pendiente'
                      check (estado in ('pendiente','en_proceso','resuelto')),
  ticket_id           text not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.solicitudes is 'Solicitudes de soporte recibidas via formulario QR';

-- Índices
create index idx_solicitudes_maquina_id on public.solicitudes(maquina_id);
create index idx_solicitudes_serial     on public.solicitudes(serial);
create index idx_solicitudes_estado     on public.solicitudes(estado);
create index idx_solicitudes_urgencia   on public.solicitudes(urgencia);
create index idx_solicitudes_created_at on public.solicitudes(created_at desc);

-- Trigger para updated_at
create trigger trg_solicitudes_updated_at
  before update on public.solicitudes
  for each row execute function public.set_updated_at();
```

---

## 7. Row Level Security (RLS)

```sql
-- Habilitar RLS en todas las tablas
alter table public.tecnicos        enable row level security;
alter table public.clientes        enable row level security;
alter table public.maquinas        enable row level security;
alter table public.maquina_tecnicos enable row level security;
alter table public.solicitudes     enable row level security;

-- ── POLÍTICAS PÚBLICAS ────────────────────────────────────────────────────────
-- El formulario público solo necesita leer datos de la máquina (serial lookup)
-- e insertar solicitudes. Usa la anon key.

-- Lectura pública: solo máquinas activas (para el formulario QR)
create policy "public_read_maquinas_activas"
  on public.maquinas for select
  to anon
  using (activo = true);

-- Lectura pública: datos del cliente de una máquina activa
create policy "public_read_clientes_de_maquinas"
  on public.clientes for select
  to anon
  using (activo = true);

-- Lectura pública: técnicos de una máquina (para notificaciones en API route)
create policy "public_read_maquina_tecnicos"
  on public.maquina_tecnicos for select
  to anon
  using (true);

create policy "public_read_tecnicos"
  on public.tecnicos for select
  to anon
  using (activo = true);

-- Inserción pública: cualquiera puede enviar una solicitud
create policy "public_insert_solicitudes"
  on public.solicitudes for insert
  to anon
  with check (true);

-- ── POLÍTICAS AUTENTICADAS (admin) ────────────────────────────────────────────
-- Usuarios autenticados (admin) tienen acceso completo

create policy "admin_all_tecnicos"
  on public.tecnicos for all
  to authenticated
  using (true) with check (true);

create policy "admin_all_clientes"
  on public.clientes for all
  to authenticated
  using (true) with check (true);

create policy "admin_all_maquinas"
  on public.maquinas for all
  to authenticated
  using (true) with check (true);

create policy "admin_all_maquina_tecnicos"
  on public.maquina_tecnicos for all
  to authenticated
  using (true) with check (true);

create policy "admin_all_solicitudes"
  on public.solicitudes for all
  to authenticated
  using (true) with check (true);
```

---

## 8. Storage bucket para fotos

```sql
-- Crear bucket para fotos de solicitudes
insert into storage.buckets (id, name, public)
values ('solicitudes-fotos', 'solicitudes-fotos', true);

-- Política: cualquiera puede subir fotos (durante el envío del formulario)
create policy "public_upload_fotos"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'solicitudes-fotos');

-- Política: las fotos son públicas para leer (para mostrar en emails y dashboard)
create policy "public_read_fotos"
  on storage.objects for select
  to anon
  using (bucket_id = 'solicitudes-fotos');

-- Política: admin puede eliminar fotos
create policy "admin_delete_fotos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'solicitudes-fotos');
```

---

## 9. Datos iniciales (seed)

```sql
-- Técnicos de Toncan Digital
insert into public.tecnicos (nombre, email) values
  ('Técnico 1', 'tec1@toncandigital.com'),
  ('Técnico 2', 'tec2@toncandigital.com'),
  ('Técnico 3', 'tec3@toncandigital.com');

-- Cliente de ejemplo (piloto)
insert into public.clientes (nombre, rif, atc_email) values
  ('Bolipuerto Sede', 'J-00000000-0', 'atc1@toncandigital.com');
```

---

## 10. Vista útil para el admin (optional)

```sql
-- Vista: máquinas con info de cliente y técnicos agregados
create or replace view public.v_maquinas_detalle as
select
  m.id,
  m.serial,
  m.modelo,
  m.ubicacion,
  m.encargado_email,
  m.activo,
  m.created_at,
  c.id           as cliente_id,
  c.nombre       as cliente_nombre,
  c.atc_email,
  array_agg(t.email order by t.nombre) filter (where t.id is not null) as tecnicos_emails,
  array_agg(t.nombre order by t.nombre) filter (where t.id is not null) as tecnicos_nombres
from public.maquinas m
join public.clientes c on c.id = m.cliente_id
left join public.maquina_tecnicos mt on mt.maquina_id = m.id
left join public.tecnicos t on t.id = mt.tecnico_id
group by m.id, c.id;

-- Vista: resumen de solicitudes por máquina
create or replace view public.v_solicitudes_resumen as
select
  serial,
  count(*)                                    as total,
  count(*) filter (where estado = 'pendiente') as pendientes,
  count(*) filter (where necesita_toner)       as con_toner,
  max(created_at)                             as ultima_solicitud
from public.solicitudes
group by serial;
```

---

## Notas de implementación

- Usar `SUPABASE_SERVICE_ROLE_KEY` en los **API Routes** del backend para bypasear RLS cuando sea necesario (ej: al enviar emails necesitas leer técnicos aunque la request sea anon).
- Usar `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el **cliente** y en el formulario público.
- El `ticket_id` se genera en el API Route: `TKT-` + 6 últimos dígitos de `Date.now()`.
- Las `fotos_urls` se almacenan como URLs públicas completas de Supabase Storage, no como paths relativos.

---

## 11. Datos de prueba (modo pruebas con Resend sandbox)

> ⚠️ **Solo mientras se usa `onboarding@resend.dev`**. Resend en modo sandbox solo entrega al correo dueño de la cuenta. Este bloque colapsa todos los destinatarios a `impresorastoncan@gmail.com` e inserta una máquina de prueba `TEST001`. Al verificar el dominio `toncandigital.com`, restaurar los correos originales.

> Cliente piloto de pruebas: **CTD**. Si en tu instancia se llama distinto, ajusta los `where nombre = 'CTD'`.

```sql
-- 1. Redirigir el Técnico 1 al correo de pruebas (mantiene UNIQUE del email)
update public.tecnicos
   set email = 'impresorastoncan@gmail.com'
 where nombre = 'Técnico 1';

-- 2. Asegurar que el cliente piloto CTD existe y su ATC es el correo de pruebas
insert into public.clientes (nombre, rif, atc_email)
values ('CTD', 'J-00000000-0', 'impresorastoncan@gmail.com')
on conflict (nombre) do update
   set atc_email = excluded.atc_email;

-- 3. Insertar máquina de prueba TEST001 ligada a CTD
insert into public.maquinas (serial, modelo, cliente_id, ubicacion, encargado_email)
select 'TEST001', 'iR-ADV 4535i', id, 'Piso 2 · Administración', 'impresorastoncan@gmail.com'
  from public.clientes
 where nombre = 'CTD'
on conflict (serial) do nothing;

-- 4. Asignar el Técnico 1 a la máquina TEST001
insert into public.maquina_tecnicos (maquina_id, tecnico_id)
select m.id, t.id
  from public.maquinas m, public.tecnicos t
 where m.serial = 'TEST001'
   and t.nombre = 'Técnico 1'
on conflict do nothing;
```

### Verificación rápida

```sql
select m.serial, m.activo, c.nombre, c.atc_email
  from public.maquinas m
  join public.clientes c on c.id = m.cliente_id
 where m.serial = 'TEST001';
```

Debe devolver 1 fila con `activo = true` y `atc_email = impresorastoncan@gmail.com`.

Después de ejecutar esto:

1. Levantar el dev server: `npm run dev`
2. Abrir: `http://localhost:3000/soporte/TEST001`
3. Llenar el formulario (probar con urgencia **Crítica** y **Sí** en tóner para ver el template al máximo)
4. Revisar el inbox de `impresorastoncan@gmail.com` — debe llegar **un solo correo** porque todos los destinatarios colapsan a la misma dirección (el `Set` en `lib/email.ts` deduplica).

---

## 12. Migración: Almacenes (punto extra)

Para soportar los almacenes **CTD QTA** y **CTD L4** donde se guardan equipos no asignados a cliente. Correr una sola vez:

```sql
-- Flag para distinguir almacenes de clientes reales
alter table public.clientes add column if not exists es_almacen boolean not null default false;

-- Crear los dos almacenes (idempotente)
insert into public.clientes (nombre, direccion, atc_email, es_almacen, activo)
select 'CTD QTA', 'CTD QTA', 'almacen@toncandigital.com', true, true
where not exists (select 1 from public.clientes where nombre = 'CTD QTA');

insert into public.clientes (nombre, direccion, atc_email, es_almacen, activo)
select 'CTD L4', 'CTD L4', 'almacen@toncandigital.com', true, true
where not exists (select 1 from public.clientes where nombre = 'CTD L4');
```

Los almacenes aparecen en la sección **Almacenes** del sidebar (ocultos en la lista de clientes). Al "Retirar" una máquina desde su edición, se selecciona uno de estos dos destinos como nueva asignación.

---

## 13. Realtime para el wallboard en vivo

Para que el wallboard `/admin/live` reciba actualizaciones instantáneas de nuevas solicitudes vía websocket, hay que agregar la tabla `solicitudes` a la publicación de Supabase Realtime. Correr una sola vez:

```sql
alter publication supabase_realtime add table public.solicitudes;
```

Verificar que quedó registrada:

```sql
select schemaname, tablename
  from pg_publication_tables
 where pubname = 'supabase_realtime'
   and tablename = 'solicitudes';
```

Debe devolver una fila. A partir de ese momento, cualquier INSERT/UPDATE/DELETE en `solicitudes` se empuja en tiempo real a los clientes suscritos al canal `solicitudes-live`, que es lo que usa `app/admin/live/LiveBoard.tsx`.
