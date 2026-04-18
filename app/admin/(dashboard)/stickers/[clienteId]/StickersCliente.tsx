'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'react-qr-code'
import type { MaquinaRow } from '@/lib/supabase/types'

interface Props {
  clienteNombre: string
  maquinas: MaquinaRow[]
}

const STICKER_CSS = `
  @page { size: A4; margin: 8mm; }
  html, body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
  .sheet {
    display: grid;
    grid-template-columns: repeat(2, 96mm);
    grid-auto-rows: 55mm;
    gap: 3mm 2mm;
    justify-content: center;
  }
  .sticker {
    width: 96mm; height: 55mm; box-sizing: border-box;
    display: flex; align-items: center; gap: 5mm;
    padding: 3mm 4mm; background: white;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .qr { flex-shrink: 0; width: 45mm; height: 45mm; }
  .qr svg { width: 100% !important; height: 100% !important; display: block; }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; height: 49mm; }
  .logo { height: 9mm; width: auto; align-self: flex-start; }
  .marca { font-size: 7pt; font-weight: 800; color: #162f52; letter-spacing: 0.3pt; margin-top: 0.5mm; }
  .serial { font-family: 'Courier New', monospace; font-size: 11pt; font-weight: 700; color: #111; margin-top: 1mm; }
  .modelo { font-size: 7pt; color: #555; margin-top: 0.5mm; }
  .contacto { font-size: 6pt; color: #333; line-height: 1.35; margin-top: auto; padding-top: 1.5mm; border-top: 0.3mm solid #e5e5e5; }
  .contacto strong { color: #162f52; }
  @media screen {
    body { background: #eee; padding: 20px; }
    .sheet { background: white; padding: 8mm; box-shadow: 0 4px 16px rgba(0,0,0,0.1); margin: 0 auto; width: fit-content; }
    .sticker { border: 1px dashed #ccc; }
    .bar { position: fixed; top: 12px; left: 12px; right: 12px; text-align: center; }
    button { padding: 10px 20px; background: #162f52; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; }
  }
  @media print {
    body { background: white; padding: 0; }
    .sheet { box-shadow: none; padding: 0; }
    .no-print { display: none !important; }
    .sticker { border: none; }
  }
`

function stickerHTML(serial: string, modelo: string, svg: string, logoUrl: string) {
  return `<div class="sticker">
    <div class="qr">${svg}</div>
    <div class="info">
      <div>
        <img class="logo" src="${logoUrl}" alt="Toncan Digital" />
        <div class="marca">TONCAN DIGITAL</div>
        <div class="serial">${serial}</div>
        <div class="modelo">${modelo}</div>
      </div>
      <div class="contacto">
        <strong>toncandigital.com</strong><br/>
        soporte@toncandigital.com<br/>
        0212-740-4501 · 286-1926
      </div>
    </div>
  </div>`
}

export default function StickersCliente({ clienteNombre, maquinas }: Props) {
  const [origin, setOrigin] = useState('')
  const refs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  function getSvg(serial: string): string | null {
    const el = refs.current.get(serial)
    const svg = el?.querySelector('svg')
    return svg ? svg.outerHTML : null
  }

  function imprimir(items: MaquinaRow[]) {
    if (items.length === 0) return
    const logoUrl = `${window.location.origin}/logo-toncan.png`
    const stickers = items
      .map(m => {
        const svg = getSvg(m.serial)
        return svg ? stickerHTML(m.serial, m.modelo, svg, logoUrl) : ''
      })
      .filter(Boolean)
      .join('\n')

    const w = window.open('', '_blank', 'width=900,height=1000')
    if (!w) return
    w.document.write(`<!doctype html>
<html>
<head>
<title>Stickers ${clienteNombre}</title>
<style>${STICKER_CSS}</style>
</head>
<body>
  <div class="bar no-print"><button onclick="window.print()">Imprimir ${items.length} sticker${items.length === 1 ? '' : 's'}</button></div>
  <div style="height: 48px" class="no-print"></div>
  <div class="sheet">${stickers}</div>
</body>
</html>`)
    w.document.close()
  }

  if (maquinas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-sm text-gray-500">Este cliente no tiene máquinas activas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">Imprimir todos los stickers</p>
          <p className="text-xs text-gray-500 mt-0.5">Hoja A4 · 8 stickers por página (2 × 4)</p>
        </div>
        <button
          type="button"
          onClick={() => imprimir(maquinas)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#162f52] text-white text-sm font-semibold hover:bg-[#1e3d6b]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir {maquinas.length} stickers
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="text-left px-5 py-3 font-semibold">Serial</th>
              <th className="text-left px-5 py-3 font-semibold">Modelo</th>
              <th className="text-left px-5 py-3 font-semibold">Ubicación</th>
              <th className="text-right px-5 py-3 font-semibold">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {maquinas.map(m => {
              const url = origin ? `${origin}/soporte/${m.serial}` : ''
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div
                      ref={el => {
                        refs.current.set(m.serial, el)
                      }}
                      style={{ position: 'absolute', left: -99999, top: -99999, width: 176, height: 176 }}
                      aria-hidden
                    >
                      {url && (
                        <QRCode
                          value={url}
                          size={176}
                          viewBox="0 0 176 176"
                        />
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-gray-800">{m.serial}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{m.modelo}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{m.ubicacion || '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => imprimir([m])}
                      disabled={!origin}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Imprimir
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
