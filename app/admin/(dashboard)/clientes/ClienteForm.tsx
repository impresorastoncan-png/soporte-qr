'use client'

import { useActionState } from 'react'
import { guardarCliente } from './actions'
import { Field, inputClass, PrimaryButton, SecondaryButton, FormActions } from '@/components/admin/ui'
import type { ClienteRow } from '@/lib/supabase/types'

export default function ClienteForm({ cliente }: { cliente?: ClienteRow }) {
  const [state, formAction, pending] = useActionState(guardarCliente, {})

  return (
    <form action={formAction} className="space-y-5">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <Field label="Nombre del cliente" required>
        <input
          type="text"
          name="nombre"
          required
          defaultValue={cliente?.nombre ?? ''}
          className={inputClass}
          placeholder="Ej: Bolipuerto Sede"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="RIF" hint="opcional">
          <input
            type="text"
            name="rif"
            defaultValue={cliente?.rif ?? ''}
            className={inputClass}
            placeholder="J-12345678-9"
          />
        </Field>

        <Field label="Correo del ATC" required>
          <input
            type="email"
            name="atc_email"
            required
            defaultValue={cliente?.atc_email ?? ''}
            className={inputClass}
            placeholder="atc@toncandigital.com"
          />
        </Field>
      </div>

      <Field label="Dirección" hint="opcional">
        <textarea
          name="direccion"
          rows={2}
          defaultValue={cliente?.direccion ?? ''}
          className={`${inputClass} resize-none`}
          placeholder="Av. Principal, Edificio..."
        />
      </Field>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="activo"
          id="activo"
          defaultChecked={cliente?.activo ?? true}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="activo" className="text-sm text-gray-700">
          Cliente activo
        </label>
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{state.error}</p>
        </div>
      )}

      <FormActions>
        <SecondaryButton href="/admin/clientes">Cancelar</SecondaryButton>
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? 'Guardando...' : cliente ? 'Guardar cambios' : 'Crear cliente'}
        </PrimaryButton>
      </FormActions>
    </form>
  )
}
