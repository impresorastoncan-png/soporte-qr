-- =============================================================
-- Fase 0 · Storage Buckets para el módulo admin
-- =============================================================

-- Crear buckets (idempotente)
insert into storage.buckets (id, name, public)
values
  ('viaticos-fotos',     'viaticos-fotos',     false),
  ('visitas-fotos',      'visitas-fotos',      false),
  ('firmas-clientes',    'firmas-clientes',    false),
  ('relaciones-anexas',  'relaciones-anexas',  false),
  ('recibos-pago',       'recibos-pago',       false)
on conflict (id) do nothing;

-- ---- Políticas de Storage ----

-- viaticos-fotos: upload por usuarios con perfil, lectura por dueño o admin
drop policy if exists "viaticos_fotos_insert" on storage.objects;
create policy "viaticos_fotos_insert" on storage.objects
  for insert with check (
    bucket_id = 'viaticos-fotos'
    and auth.role() = 'authenticated'
    and admin.has_profile()
  );

drop policy if exists "viaticos_fotos_select" on storage.objects;
create policy "viaticos_fotos_select" on storage.objects
  for select using (
    bucket_id = 'viaticos-fotos'
    and auth.role() = 'authenticated'
    and (admin.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );

-- visitas-fotos: upload por usuarios con perfil, lectura por usuarios con perfil
drop policy if exists "visitas_fotos_insert" on storage.objects;
create policy "visitas_fotos_insert" on storage.objects
  for insert with check (
    bucket_id = 'visitas-fotos'
    and auth.role() = 'authenticated'
    and admin.has_profile()
  );

drop policy if exists "visitas_fotos_select" on storage.objects;
create policy "visitas_fotos_select" on storage.objects
  for select using (
    bucket_id = 'visitas-fotos'
    and auth.role() = 'authenticated'
    and admin.has_profile()
  );

-- firmas-clientes: upload y lectura por usuarios con perfil
drop policy if exists "firmas_insert" on storage.objects;
create policy "firmas_insert" on storage.objects
  for insert with check (
    bucket_id = 'firmas-clientes'
    and auth.role() = 'authenticated'
    and admin.has_profile()
  );

drop policy if exists "firmas_select" on storage.objects;
create policy "firmas_select" on storage.objects
  for select using (
    bucket_id = 'firmas-clientes'
    and auth.role() = 'authenticated'
    and admin.has_profile()
  );

-- relaciones-anexas: solo admin
drop policy if exists "relaciones_insert" on storage.objects;
create policy "relaciones_insert" on storage.objects
  for insert with check (
    bucket_id = 'relaciones-anexas'
    and auth.role() = 'authenticated'
    and admin.is_admin()
  );

drop policy if exists "relaciones_select" on storage.objects;
create policy "relaciones_select" on storage.objects
  for select using (
    bucket_id = 'relaciones-anexas'
    and auth.role() = 'authenticated'
    and admin.is_admin()
  );

-- recibos-pago: admin puede subir/leer, empleado lee los suyos
drop policy if exists "recibos_insert" on storage.objects;
create policy "recibos_insert" on storage.objects
  for insert with check (
    bucket_id = 'recibos-pago'
    and auth.role() = 'authenticated'
    and admin.is_admin()
  );

drop policy if exists "recibos_select" on storage.objects;
create policy "recibos_select" on storage.objects
  for select using (
    bucket_id = 'recibos-pago'
    and auth.role() = 'authenticated'
    and (admin.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );
