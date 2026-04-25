-- =============================================================
-- Fase 0 · Toncan Digital — Schema admin
-- Idempotente: se puede re-correr sin romper
-- =============================================================

-- 0. Schema
create schema if not exists admin;

-- 1. Enum de roles (dropdown en Supabase Table Editor)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role' and typnamespace = (select oid from pg_namespace where nspname = 'admin')) then
    create type admin.app_role as enum (
      'super_admin',
      'admin',
      'contabilidad',
      'supervisor',
      'tecnico',
      'chofer'
    );
  end if;
end
$$;

-- =============================================================
-- 2. Tablas
-- =============================================================

-- 2.1 profiles (extiende auth.users)
create table if not exists admin.profiles (
  user_id     uuid primary key references auth.users on delete cascade,
  nombre      text not null,
  cedula      text unique,
  rol         admin.app_role not null default 'tecnico',
  telefono    text,
  empleado_id uuid, -- FK se agrega después de crear empleados
  activo      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2.2 empleados
create table if not exists admin.empleados (
  id               uuid primary key default gen_random_uuid(),
  cedula           text unique not null,
  nombre_completo  text not null,
  cta_bancaria     text,
  banco            text default '0134 Banesco',
  cargo            text,
  salario_base_usd numeric(12,2) not null,
  fecha_ingreso    date,
  activo           boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  deleted_at       timestamptz
);

-- FK profiles -> empleados (ahora que empleados existe)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'profiles_empleado_id_fkey'
      and table_schema = 'admin'
  ) then
    alter table admin.profiles
      add constraint profiles_empleado_id_fkey
      foreign key (empleado_id) references admin.empleados(id);
  end if;
end
$$;

-- 2.3 nomina_mensual
create table if not exists admin.nomina_mensual (
  id                    uuid primary key default gen_random_uuid(),
  empleado_id           uuid not null references admin.empleados on delete restrict,
  periodo               text not null,
  salario_usd           numeric(12,2) not null,
  prestaciones_usd      numeric(12,2) not null,
  bono_vacacional_usd   numeric(12,2) not null,
  utilidades_usd        numeric(12,2) not null,
  total_usd             numeric(12,2) generated always as (salario_usd + prestaciones_usd + bono_vacacional_usd + utilidades_usd) stored,
  tasa_bcv              numeric(12,4) not null,
  total_bs              numeric(14,2) generated always as ((salario_usd + prestaciones_usd + bono_vacacional_usd + utilidades_usd) * tasa_bcv) stored,
  pagado                boolean default false,
  fecha_pago            date,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  unique (empleado_id, periodo)
);

-- 2.4 clientes (admin)
create table if not exists admin.clientes (
  id                uuid primary key default gen_random_uuid(),
  rif               text unique not null,
  razon_social      text not null,
  atc               text check (atc in ('ATC1','ATC2','ATC3')),
  direccion         text,
  contacto_nombre   text,
  contacto_telefono text,
  tarifa_bn_usd     numeric(10,4) default 0.04,
  tarifa_color_usd  numeric(10,4) default 0.60,
  activo            boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  deleted_at        timestamptz
);

-- 2.5 equipos
create table if not exists admin.equipos (
  id                uuid primary key default gen_random_uuid(),
  serial            text unique not null,
  modelo            text,
  marca             text,
  cliente_id        uuid references admin.clientes,
  ubicacion         text,
  estado            text not null default 'inventario' check (estado in ('campo','inventario','mantenimiento','baja')),
  fecha_instalacion date,
  qr_code           text unique,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  deleted_at        timestamptz
);

-- 2.6 visitas_tecnicas
create table if not exists admin.visitas_tecnicas (
  id              uuid primary key default gen_random_uuid(),
  tecnico_id      uuid not null references auth.users,
  acompanante_id  uuid references auth.users,
  cliente_id      uuid references admin.clientes,
  equipo_id       uuid references admin.equipos,
  tipo            text not null check (tipo in ('mantenimiento_preventivo','reparacion','instalacion','entrega_insumos','retiro','traslado_foraneo')),
  check_in        timestamptz,
  check_out       timestamptz,
  lat_in          numeric(10,6),
  lng_in          numeric(10,6),
  lat_out         numeric(10,6),
  lng_out         numeric(10,6),
  notas           text,
  firma_url       text,
  status          text not null default 'abierta' check (status in ('abierta','completada','revisada','cancelada')),
  km_inicial      integer,
  km_final        integer,
  destino_foraneo text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 2.7 visita_fotos
create table if not exists admin.visita_fotos (
  id        uuid primary key default gen_random_uuid(),
  visita_id uuid not null references admin.visitas_tecnicas on delete cascade,
  url       text not null,
  momento   text check (momento in ('antes','despues','otro')),
  orden     smallint default 0,
  created_at timestamptz default now()
);

-- 2.8 lecturas_contador
create table if not exists admin.lecturas_contador (
  id                  uuid primary key default gen_random_uuid(),
  equipo_id           uuid not null references admin.equipos,
  visita_id           uuid references admin.visitas_tecnicas,
  fecha               date not null,
  contador_bn         integer not null,
  contador_color      integer not null,
  copias_periodo_bn   integer,
  copias_periodo_color integer,
  created_at          timestamptz default now()
);

-- 2.9 viaticos
create table if not exists admin.viaticos (
  id                uuid primary key default gen_random_uuid(),
  empleado_id       uuid not null references admin.empleados,
  user_id           uuid references auth.users,
  visita_id         uuid references admin.visitas_tecnicas,
  tipo              text not null check (tipo in ('gasolina','peaje','comida','hospedaje','otro')),
  monto_bs          numeric(14,2) not null,
  monto_usd         numeric(12,2),
  tasa_bcv          numeric(12,4),
  foto_url          text,
  fecha             date not null default current_date,
  status            text not null default 'pendiente' check (status in ('pendiente','aprobado','rechazado','ajustado')),
  monto_aprobado_bs numeric(14,2),
  aprobado_por      uuid references auth.users,
  aprobado_at       timestamptz,
  nota_aprobacion   text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  deleted_at        timestamptz
);

-- 2.10 cobros_mensuales
create table if not exists admin.cobros_mensuales (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid not null references admin.clientes,
  periodo         text not null,
  copias_bn       integer default 0,
  copias_color    integer default 0,
  monto_bn_usd    numeric(12,2) default 0,
  monto_color_usd numeric(12,2) default 0,
  total_usd       numeric(12,2) generated always as (monto_bn_usd + monto_color_usd) stored,
  tasa_bcv        numeric(12,4),
  archivo_origen  text,
  importado_por   uuid references auth.users,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (cliente_id, periodo)
);

-- 2.11 costos_estructura
create table if not exists admin.costos_estructura (
  id        uuid primary key default gen_random_uuid(),
  periodo   text not null,
  categoria text not null check (categoria in ('personal','viaticos','movilizacion','dotacion','insumos','admin','utilidad','financieros','otro')),
  concepto  text not null,
  monto_usd numeric(12,2) not null,
  monto_eur numeric(12,2),
  monto_bs  numeric(14,2),
  tasa_bcv  numeric(12,4),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.12 tasas_cambio
create table if not exists admin.tasas_cambio (
  fecha   date primary key,
  bs_usd  numeric(12,4) not null,
  bs_eur  numeric(12,4) not null,
  fuente  text default 'BCV' check (fuente in ('BCV','manual')),
  created_at timestamptz default now()
);

-- 2.13 audit_log
create table if not exists admin.audit_log (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users,
  tabla          text not null,
  operacion      text not null check (operacion in ('insert','update','delete')),
  registro_id    uuid,
  datos_antes    jsonb,
  datos_despues  jsonb,
  created_at     timestamptz default now()
);

-- =============================================================
-- 3. RLS — activar en todas las tablas
-- =============================================================
alter table admin.profiles          enable row level security;
alter table admin.empleados         enable row level security;
alter table admin.nomina_mensual    enable row level security;
alter table admin.clientes          enable row level security;
alter table admin.equipos           enable row level security;
alter table admin.visitas_tecnicas  enable row level security;
alter table admin.visita_fotos      enable row level security;
alter table admin.lecturas_contador enable row level security;
alter table admin.viaticos          enable row level security;
alter table admin.cobros_mensuales  enable row level security;
alter table admin.costos_estructura enable row level security;
alter table admin.tasas_cambio      enable row level security;
alter table admin.audit_log         enable row level security;

-- =============================================================
-- 4. Funciones helper
-- =============================================================

-- 4.1 touch_updated_at
create or replace function admin.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 4.2 current_user_rol
create or replace function admin.current_user_rol()
returns admin.app_role as $$
  select rol from admin.profiles where user_id = auth.uid();
$$ language sql stable security definer;

-- 4.3 is_admin
create or replace function admin.is_admin()
returns boolean as $$
  select admin.current_user_rol() in ('super_admin', 'admin', 'contabilidad');
$$ language sql stable security definer;

-- 4.4 has_profile — tiene perfil en admin.profiles
create or replace function admin.has_profile()
returns boolean as $$
  select exists(select 1 from admin.profiles where user_id = auth.uid() and activo = true);
$$ language sql stable security definer;

-- 4.5 log_audit
create or replace function admin.log_audit()
returns trigger as $$
begin
  if (tg_op = 'DELETE') then
    insert into admin.audit_log (user_id, tabla, operacion, registro_id, datos_antes)
    values (auth.uid(), tg_table_name, 'delete', old.id, to_jsonb(old));
    return old;
  elsif (tg_op = 'UPDATE') then
    insert into admin.audit_log (user_id, tabla, operacion, registro_id, datos_antes, datos_despues)
    values (auth.uid(), tg_table_name, 'update', new.id, to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'INSERT') then
    insert into admin.audit_log (user_id, tabla, operacion, registro_id, datos_despues)
    values (auth.uid(), tg_table_name, 'insert', new.id, to_jsonb(new));
    return new;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- =============================================================
-- 5. Triggers — updated_at
-- =============================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','empleados','nomina_mensual','clientes','equipos',
    'visitas_tecnicas','viaticos','cobros_mensuales','costos_estructura'
  ] loop
    execute format(
      'drop trigger if exists trg_updated_at on admin.%I; '
      'create trigger trg_updated_at before update on admin.%I '
      'for each row execute function admin.touch_updated_at();',
      t, t
    );
  end loop;
end
$$;

-- =============================================================
-- 6. Triggers — audit_log
-- =============================================================
do $$
declare
  t text;
begin
  foreach t in array array['empleados','nomina_mensual','viaticos','cobros_mensuales'] loop
    execute format(
      'drop trigger if exists trg_audit on admin.%I; '
      'create trigger trg_audit after insert or update or delete on admin.%I '
      'for each row execute function admin.log_audit();',
      t, t
    );
  end loop;
end
$$;

-- =============================================================
-- 7. Politicas RLS
-- =============================================================

-- ---- profiles ----
drop policy if exists "profiles_select_own" on admin.profiles;
create policy "profiles_select_own" on admin.profiles
  for select using (user_id = auth.uid() or admin.is_admin());

drop policy if exists "profiles_update_admin" on admin.profiles;
create policy "profiles_update_admin" on admin.profiles
  for update using (admin.is_admin());

drop policy if exists "profiles_insert_admin" on admin.profiles;
create policy "profiles_insert_admin" on admin.profiles
  for insert with check (admin.is_admin());

-- ---- empleados ----
drop policy if exists "empleados_admin" on admin.empleados;
create policy "empleados_admin" on admin.empleados
  for all using (admin.is_admin());

-- ---- nomina_mensual ----
drop policy if exists "nomina_admin" on admin.nomina_mensual;
create policy "nomina_admin" on admin.nomina_mensual
  for all using (admin.is_admin());

-- ---- clientes (admin schema) ----
drop policy if exists "clientes_read" on admin.clientes;
create policy "clientes_read" on admin.clientes
  for select using (admin.has_profile());

drop policy if exists "clientes_write" on admin.clientes;
create policy "clientes_write" on admin.clientes
  for all using (admin.is_admin()) with check (admin.is_admin());

-- ---- equipos ----
drop policy if exists "equipos_read" on admin.equipos;
create policy "equipos_read" on admin.equipos
  for select using (admin.has_profile());

drop policy if exists "equipos_write" on admin.equipos;
create policy "equipos_write" on admin.equipos
  for all using (admin.is_admin()) with check (admin.is_admin());

-- ---- visitas_tecnicas ----
drop policy if exists "visitas_select" on admin.visitas_tecnicas;
create policy "visitas_select" on admin.visitas_tecnicas
  for select using (
    tecnico_id = auth.uid()
    or acompanante_id = auth.uid()
    or admin.current_user_rol() in ('super_admin','admin','contabilidad','supervisor')
  );

drop policy if exists "visitas_insert_tecnico" on admin.visitas_tecnicas;
create policy "visitas_insert_tecnico" on admin.visitas_tecnicas
  for insert with check (tecnico_id = auth.uid() or admin.is_admin());

drop policy if exists "visitas_update" on admin.visitas_tecnicas;
create policy "visitas_update" on admin.visitas_tecnicas
  for update using (
    tecnico_id = auth.uid()
    or admin.current_user_rol() in ('super_admin','admin','contabilidad','supervisor')
  );

-- ---- visita_fotos ----
drop policy if exists "visita_fotos_select" on admin.visita_fotos;
create policy "visita_fotos_select" on admin.visita_fotos
  for select using (
    exists (
      select 1 from admin.visitas_tecnicas v
      where v.id = visita_id
        and (v.tecnico_id = auth.uid() or v.acompanante_id = auth.uid()
             or admin.current_user_rol() in ('super_admin','admin','contabilidad','supervisor'))
    )
  );

drop policy if exists "visita_fotos_insert" on admin.visita_fotos;
create policy "visita_fotos_insert" on admin.visita_fotos
  for insert with check (
    exists (
      select 1 from admin.visitas_tecnicas v
      where v.id = visita_id and (v.tecnico_id = auth.uid() or admin.is_admin())
    )
  );

-- ---- lecturas_contador ----
drop policy if exists "lecturas_select" on admin.lecturas_contador;
create policy "lecturas_select" on admin.lecturas_contador
  for select using (admin.has_profile());

drop policy if exists "lecturas_insert" on admin.lecturas_contador;
create policy "lecturas_insert" on admin.lecturas_contador
  for insert with check (admin.has_profile());

-- ---- viaticos ----
drop policy if exists "viaticos_select" on admin.viaticos;
create policy "viaticos_select" on admin.viaticos
  for select using (user_id = auth.uid() or admin.is_admin());

drop policy if exists "viaticos_insert" on admin.viaticos;
create policy "viaticos_insert" on admin.viaticos
  for insert with check (user_id = auth.uid() or admin.is_admin());

drop policy if exists "viaticos_update_admin" on admin.viaticos;
create policy "viaticos_update_admin" on admin.viaticos
  for update using (admin.is_admin());

-- ---- cobros_mensuales ----
drop policy if exists "cobros_admin" on admin.cobros_mensuales;
create policy "cobros_admin" on admin.cobros_mensuales
  for all using (admin.is_admin());

-- ---- costos_estructura ----
drop policy if exists "costos_admin" on admin.costos_estructura;
create policy "costos_admin" on admin.costos_estructura
  for all using (admin.is_admin());

-- ---- tasas_cambio ----
drop policy if exists "tasas_read" on admin.tasas_cambio;
create policy "tasas_read" on admin.tasas_cambio
  for select using (admin.has_profile());

drop policy if exists "tasas_write" on admin.tasas_cambio;
create policy "tasas_write" on admin.tasas_cambio
  for all using (admin.is_admin()) with check (admin.is_admin());

-- ---- audit_log ----
drop policy if exists "audit_select_super" on admin.audit_log;
create policy "audit_select_super" on admin.audit_log
  for select using (admin.current_user_rol() = 'super_admin');

-- No insert policy for clients — only triggers write to audit_log

-- =============================================================
-- 8. Grants — acceso al schema desde anon y authenticated
-- =============================================================
grant usage on schema admin to anon, authenticated;
grant all on all tables in schema admin to authenticated;
grant select on all tables in schema admin to anon;
