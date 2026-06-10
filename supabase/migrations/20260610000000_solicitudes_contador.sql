-- Agrega campo contador a solicitudes
-- Registra la lectura del equipo al momento de la solicitud
-- Es un histórico por máquina que no se resetea al cambiar de cliente
alter table public.solicitudes
  add column if not exists contador integer not null default 0;
