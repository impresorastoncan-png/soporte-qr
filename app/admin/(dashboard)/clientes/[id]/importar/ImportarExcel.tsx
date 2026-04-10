'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { PrimaryButton, SecondaryButton } from '@/components/admin/ui'
import { importarMaquinas, type FilaImportar } from '../../../maquinas/actions'

type PreviewFila = FilaImportar & { _valida: boolean; _error?: string }

type ImportResultado = {
  inserted?: number
  updated?: number
  skipped?: { serial: string; razon: string }[]
  error?: string
}

// Normaliza headers (quita acentos, pasa a lowercase, trim)
function normalizar(s: string): string {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function ImportarExcel({
  clienteId,
  clienteNombre,
}: {
  clienteId: string
  clienteNombre: string
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filas, setFilas] = useState<PreviewFila[]>([])
  const [archivoNombre, setArchivoNombre] = useState('')
  const [parseError, setParseError] = useState('')
  const [resultado, setResultado] = useState<ImportResultado | null>(null)
  const [pending, start] = useTransition()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setParseError('')
    setResultado(null)
    setFilas([])

    const file = e.target.files?.[0]
    if (!file) return

    setArchivoNombre(file.name)

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        setParseError('El archivo no contiene hojas.')
        return
      }
      const sheet = workbook.Sheets[sheetName]
      const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      if (rawRows.length === 0) {
        setParseError('La hoja está vacía.')
        return
      }

      // Mapear columnas normalizadas
      const parsed: PreviewFila[] = rawRows.map((row) => {
        const normalizada: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(row)) {
          normalizada[normalizar(k)] = v
        }

        const serial = String(normalizada['serial'] ?? '').trim().toUpperCase()
        const modelo = String(normalizada['modelo'] ?? '').trim()
        const ubicacion = String(
          normalizada['ubicacion'] ?? normalizada['ubicación'] ?? ''
        ).trim()
        const encargado_email = String(
          normalizada['encargado_email'] ?? normalizada['encargado'] ?? normalizada['correo_encargado'] ?? ''
        ).trim().toLowerCase() || null

        let valida = true
        let error: string | undefined

        if (!serial) {
          valida = false
          error = 'Serial vacío'
        } else if (!modelo) {
          valida = false
          error = 'Modelo vacío'
        } else if (encargado_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(encargado_email)) {
          valida = false
          error = 'Correo del encargado inválido'
        }

        return { serial, modelo, ubicacion, encargado_email, _valida: valida, _error: error }
      })

      setFilas(parsed)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Error al parsear el archivo')
    }
  }

  function handleImportar() {
    const validas = filas.filter(f => f._valida).map(f => ({
      serial: f.serial,
      modelo: f.modelo,
      ubicacion: f.ubicacion,
      encargado_email: f.encargado_email,
    }))
    if (validas.length === 0) {
      setParseError('No hay filas válidas para importar')
      return
    }
    start(async () => {
      const res = await importarMaquinas(clienteId, validas)
      setResultado(res)
      if (!res.error) {
        // limpiar selección después de importar
        setFilas([])
        setArchivoNombre('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        router.refresh()
      }
    })
  }

  function reset() {
    setFilas([])
    setArchivoNombre('')
    setParseError('')
    setResultado(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validas = filas.filter(f => f._valida).length
  const invalidas = filas.length - validas

  return (
    <div>
      {/* Upload zone */}
      {filas.length === 0 && !resultado && (
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-semibold text-gray-700">Selecciona un archivo Excel</p>
            <p className="text-xs text-gray-500 mt-1">Formatos: .xlsx, .xls, .csv</p>
          </div>
          {parseError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{parseError}</p>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {filas.length > 0 && !resultado && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">{archivoNombre}</p>
              <p className="text-xs text-gray-500">
                {filas.length} fila(s) · <span className="text-green-600 font-semibold">{validas} válidas</span>
                {invalidas > 0 && <> · <span className="text-red-600 font-semibold">{invalidas} con error</span></>}
              </p>
            </div>
            <SecondaryButton onClick={reset}>Cambiar archivo</SecondaryButton>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">#</th>
                  <th className="text-left px-3 py-2 font-semibold">Serial</th>
                  <th className="text-left px-3 py-2 font-semibold">Modelo</th>
                  <th className="text-left px-3 py-2 font-semibold">Ubicación</th>
                  <th className="text-left px-3 py-2 font-semibold">Encargado</th>
                  <th className="text-left px-3 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filas.map((f, i) => (
                  <tr key={i} className={f._valida ? '' : 'bg-red-50'}>
                    <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs font-semibold text-gray-700">{f.serial || '—'}</td>
                    <td className="px-3 py-2 text-gray-800">{f.modelo || '—'}</td>
                    <td className="px-3 py-2 text-gray-600 text-xs">{f.ubicacion || '—'}</td>
                    <td className="px-3 py-2 text-gray-600 text-xs">{f.encargado_email || '—'}</td>
                    <td className="px-3 py-2">
                      {f._valida ? (
                        <span className="text-green-600 text-xs font-semibold">OK</span>
                      ) : (
                        <span className="text-red-600 text-xs font-semibold" title={f._error}>{f._error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2 pt-5 border-t border-gray-100 mt-5">
            <p className="text-xs text-gray-500">
              Se importarán {validas} máquina(s) al cliente <strong>{clienteNombre}</strong>.
            </p>
            <div className="flex gap-2">
              <SecondaryButton onClick={reset}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleImportar} disabled={pending || validas === 0}>
                {pending ? 'Importando...' : `Importar ${validas} máquina(s)`}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div>
          {resultado.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-semibold text-sm">Error al importar</p>
              <p className="text-red-600 text-sm mt-1">{resultado.error}</p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-green-800 font-bold">Importación completada</p>
                  <p className="text-green-700 text-sm">
                    {resultado.inserted} nueva(s), {resultado.updated} actualizada(s)
                    {resultado.skipped && resultado.skipped.length > 0 && <>, {resultado.skipped.length} omitida(s)</>}
                  </p>
                </div>
              </div>
              {resultado.skipped && resultado.skipped.length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs font-semibold text-green-900 cursor-pointer">
                    Ver filas omitidas ({resultado.skipped.length})
                  </summary>
                  <ul className="mt-2 text-xs text-green-900 space-y-1 pl-4">
                    {resultado.skipped.map((s, i) => (
                      <li key={i}>• <span className="font-mono">{s.serial}</span> — {s.razon}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <SecondaryButton onClick={reset}>Importar otro archivo</SecondaryButton>
            <PrimaryButton href={`/admin/clientes/${clienteId}`}>Volver al cliente</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  )
}
