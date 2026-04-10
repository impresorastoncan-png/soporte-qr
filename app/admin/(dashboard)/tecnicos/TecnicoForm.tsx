'use client'

import { useActionState } from 'react'
import { guardarTecnico } from './actions'
import { Field, inputClass, PrimaryButton, SecondaryButton, FormActions } from '@/components/admin/ui'
import type { TecnicoRow } from '@/lib/supabase/types'

export default function TecnicoForm({ tecnico }: { tecnico?: TecnicoRow }) {
  const [state, formAction, pending] = useActionState(guardarTecnico, {})

  return (
    <form action={formAction} className="space-y-5">
      {tecnico && <input type="hidden" name="id" value={tecnico.id} />}

      <Field label="Nombre" required>
        <input
          type="text"
          name="nombre"
          required
          defaultValue={tecnico?.nombre ?? ''}
          className={inputClass}
          placeholder="Ej: Juan Pérez"
        />
      </Field>

      <Field label="Correo electrónico" required>
        <input
          type="email"
          name="email"
          required
          defaultValue={tecnico?.email ?? ''}
          className={inputClass}
          placeholder="tec1@toncandigital.com"
        />
      </Field>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="activo"
          id="activo"
          defaultChecked={tecnico?.activo ?? true}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="activo" className="text-sm text-gray-700">
          Técnico activo (aparecerá en listados y notificaciones)
        </label>
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{state.error}</p>
        </div>
      )}

      <FormActions>
        <SecondaryButton href="/admin/tecnicos">Cancelar</SecondaryButton>
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? 'Guardando...' : tecnico ? 'Guardar cambios' : 'Crear técnico'}
        </PrimaryButton>
      </FormActions>
    </form>
  )
}
