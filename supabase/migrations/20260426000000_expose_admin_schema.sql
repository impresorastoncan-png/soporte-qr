-- Exponer schema admin a la API de PostgREST (Supabase JS client)
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, admin';
NOTIFY pgrst, 'reload config';
