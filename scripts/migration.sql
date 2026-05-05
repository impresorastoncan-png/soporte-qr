-- Profile para gerenciatc@toncandigital.com
INSERT INTO admin.profiles (user_id, nombre, rol, activo)
VALUES ('9eebb336-817a-4072-80e3-f85fd085f533', 'Gerencia ATC', 'admin', true)
ON CONFLICT (user_id) DO NOTHING;

-- Nuevos campos en admin.clientes
ALTER TABLE admin.clientes
  ADD COLUMN IF NOT EXISTS copiado_minimo integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tarifa_fija_usd numeric(10,4) DEFAULT 0;

-- Nuevos campos en admin.cobros_mensuales
ALTER TABLE admin.cobros_mensuales
  ADD COLUMN IF NOT EXISTS estado_relacion text DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS aplica_minimo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS monto_minimo_usd numeric(12,2) DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cobros_mensuales_estado_relacion_check'
  ) THEN
    ALTER TABLE admin.cobros_mensuales
      ADD CONSTRAINT cobros_mensuales_estado_relacion_check
      CHECK (estado_relacion IN ('pendiente','proforma','listo'));
  END IF;
END
$$;
