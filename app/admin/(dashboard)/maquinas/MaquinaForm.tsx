'use client'

import { useActionState } from 'react'
import { guardarMaquina } from './actions'
import { Field, inputClass, PrimaryButton, SecondaryButton, FormActions } from '@/components/admin/ui'
import type { MaquinaRow, ClienteRow, TecnicoRow } from '@/lib/supabase/types'

interface Props {
  maquina?: MaquinaRow
  clientes: ClienteRow[]
  tecnicos: TecnicoRow[]
  tecnicoIdsAsignados?: string[]
  clienteIdPreseleccionado?: string
}

export default function MaquinaForm({
  maquina,
  clientes,
  tecnicos,
  tecnicoIdsAsignados = [],
  clienteIdPreseleccionado,
}: Props) {
  const [state, formAction, pending] = useActionState(guardarMaquina, {})
  const volverHref = maquina?.cliente_id
    ? `/admin/clientes/${maquina.cliente_id}`
    : clienteIdPreseleccionado
      ? `/admin/clientes/${clienteIdPreseleccionado}`
      : '/admin/maquinas'

  return (
    <form action={formAction} className="space-y-5">
      {maquina && <input type="hidden" name="id" value={maquina.id} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Serial" required hint="se usa en el QR, debe ser único">
          <input
            type="text"
            name="serial"
            required
            defaultValue={maquina?.serial ?? ''}
            className={`${inputClass} font-mono uppercase`}
            placeholder="XWH04309"
          />
        </Field>

        <Field label="Modelo" required>
          <input
            type="text"
            name="modelo"
            required
            defaultValue={maquina?.modelo ?? ''}
            className={inputClass}
            placeholder="iR-ADV 4535i"
          />
        </Field>
      </div>

      <Field label="Cliente" required>
        <select
          name="cliente_id"
          required
          defaultValue={maquina?.cliente_id ?? clienteIdPreseleccionado ?? ''}
          className={inputClass}
        >
          <option value="">Seleccionar cliente...</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Ubicación" hint="opcional">
          <input
            type="text"
            name="ubicacion"
            defaultValue={maquina?.ubicacion ?? ''}
            className={inputClass}
            placeholder="Piso 2 · Administración"
          />
        </Field>

        <Field label="Correo del encargado" hint="opcional">
          <input
            type="email"
            name="encargado_email"
            defaultValue={maquina?.encargado_email ?? ''}
            className={inputClass}
            placeholder="encargado@cliente.com"
          />
        </Field>
      </div>

      <Field label="Técnicos asignados" hint="marque uno o más">
        {tecnicos.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No hay técnicos registrados. <a href="/admin/tecnicos/nuevo" className="text-blue-600 underline">Crear uno</a>
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {tecnicos.map(t => (
              <label
                key={t.id}
                className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  name="tecnico_ids"
                  value={t.id}
                  defaultChecked={tecnicoIdsAsignados.includes(t.id)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{t.nombre}</p>
                  <p className="text-xs text-gray-500 truncate">{t.email}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </Field>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="activo"
          id="activo"
          defaultChecked={maquina?.activo ?? true}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="activo" className="text-sm text-gray-700">
          Máquina activa (aparece en el formulario QR)
        </label>
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{state.error}</p>
        </div>
      )}

      <FormActions>
        <SecondaryButton href={volverHref}>Cancelar</SecondaryButton>
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? 'Guardando...' : maquina ? 'Guardar cambios' : 'Crear máquina'}
        </PrimaryButton>
      </FormActions>
    </form>
  )
}
