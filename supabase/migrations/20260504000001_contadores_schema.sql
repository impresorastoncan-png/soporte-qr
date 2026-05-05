-- =============================================================
-- Contadores: campos adicionales para copiado minimo y estados
-- Idempotente: usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- =============================================================

-- 1. admin.clientes: copiado minimo y tarifa fija por cliente
alter table admin.clientes
  add column if not exists copiado_minimo integer default 0,
  add column if not exists tarifa_fija_usd numeric(10,4) default 0;

-- 2. admin.cobros_mensuales: estado de relacion anexa y copiado minimo
alter table admin.cobros_mensuales
  add column if not exists estado_relacion text default 'pendiente',
  add column if not exists aplica_minimo boolean default false,
  add column if not exists monto_minimo_usd numeric(12,2) default 0;

-- Check constraint para estado_relacion
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cobros_mensuales_estado_relacion_check'
  ) then
    alter table admin.cobros_mensuales
      add constraint cobros_mensuales_estado_relacion_check
      check (estado_relacion in ('pendiente','proforma','listo'));
  end if;
end
$$;
