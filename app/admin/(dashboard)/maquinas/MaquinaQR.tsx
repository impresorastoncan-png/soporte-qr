'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'react-qr-code'

interface Props {
  serial: string
  modelo: string
  clienteNombre: string
}

export default function MaquinaQR({ serial, modelo, clienteNombre }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [origin, setOrigin] = useState('')
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || ''
  const url = `${baseUrl}/soporte/${serial}`

  function handleImprimir() {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const svgHtml = svg.outerHTML
    const logoUrl = `${window.location.origin}/logo-toncan.png`
    const w = window.open('', '_blank', 'width=480,height=640')
    if (!w) return
    w.document.write(`<!doctype html>
<html>
<head>
<title>QR ${serial}</title>
<style>
  @page { size: 96mm 55mm; margin: 0; }
  html, body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
  .sticker {
    width: 96mm; height: 55mm; box-sizing: border-box;
    display: flex; align-items: center; gap: 5mm;
    padding: 3mm 4mm; background: white;
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
    body { background: #eee; padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .sticker { box-shadow: 0 4px 16px rgba(0,0,0,0.1); border: 1px solid #ddd; }
    button { padding: 10px 20px; background: #162f52; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; }
  }
  @media print {
    body { background: white; padding: 0; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
  <div class="sticker">
    <div class="qr">${svgHtml}</div>
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
  </div>
  <button class="no-print" onclick="window.print()">Imprimir sticker</button>
</body>
</html>`)
    w.document.close()
  }

  if (!abierto) {
    return (
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Mostrar QR
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6 border border-gray-200 rounded-xl p-5 bg-gray-50">
      <div className="flex items-start gap-5">
        <div
          ref={qrRef}
          className="bg-white p-3 rounded-lg border border-gray-200 shrink-0"
          style={{ width: 200, height: 200 }}
        >
          <QRCode
            value={url}
            size={176}
            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
            viewBox="0 0 176 176"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase text-gray-400 font-semibold mb-1">Código QR de la máquina</p>
          <p className="font-mono text-sm font-bold text-gray-800">{serial}</p>
          <p className="text-sm text-gray-600 mt-0.5">{modelo}</p>
          <p className="text-xs text-gray-500 mt-0.5">Cliente: {clienteNombre}</p>
          <p className="text-xs text-gray-400 mt-3 break-all">{url}</p>

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleImprimir}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#162f52] text-white text-sm font-semibold hover:bg-[#1e3d6b]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir sticker
            </button>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Ocultar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
