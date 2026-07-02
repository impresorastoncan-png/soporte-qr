'use client'

import { useEffect, useRef, useState } from 'react'

const DIAGRAMA = `
flowchart TD
  subgraph CLIENTE["🖨️ Cliente (usuario final)"]
    QR["QR Sticker en impresora"]
    FORM["/soporte/[serial] — Formulario de falla"]
  end

  subgraph INGRESO["📥 Ingreso de solicitud"]
    API_SOL["POST /api/soporte<br/>Validación Zod"]
    DB_SOL[("solicitudes<br/>urgencia · estado · contador")]
    EMAILS["Resend — emails automáticos"]
  end

  subgraph DEST_EMAIL["📧 Destinatarios de email"]
    ATC["ATC del cliente"]
    TECN_EMAIL["Técnicos asignados"]
    ALMA["almacen@toncandigital.com"]
    SOP["soporte@toncandigital.com"]
    CC["Solicitante (CC)"]
  end

  subgraph TECNICO["🔧 Portal Técnico (público)"]
    TABLERO["/tecnicos — Tablero en vivo<br/>polling 20 s"]
    VISITA_PAGE["/tecnicos/solicitudes/[id]<br/>Informe de visita"]
    API_VIS["POST /api/tecnicos/visita<br/>reclamar · iniciar · completar"]
    DB_VIS[("visitas_tecnicas<br/>foto · falla · solución · firma")]
  end

  subgraph ADMIN["🔐 Admin (autenticado)"]
    ADM_DASH["/admin — Dashboard"]
    ADM_SOL["/admin/solicitudes"]
    ADM_MAQ["/admin/maquinas<br/>QR · stickers · PDF"]
    ADM_CLI["/admin/clientes · almacenes"]
    ADM_TEC["/admin/tecnicos"]
    ADM_LIVE["/admin/live — Wallboard Realtime"]
    ADM_MET["/admin/metricas<br/>tiempos · urgencias · visitas/mes"]
    ADM_CONT["/admin/contadores/[clienteId]<br/>importar Excel → facturación"]
    ADM_REP["/admin/reportes (PIN)"]
  end

  subgraph DB_ADMIN["🗄️ Schema admin (Supabase)"]
    DB_LECT[("lecturas_contador")]
    DB_COB[("cobros_mensuales")]
    DB_PROF[("profiles — roles")]
    DB_EMP[("empleados")]
    DB_TASA[("tasas_cambio BCV")]
  end

  QR -->|"Escanear"| FORM
  FORM -->|"Submit"| API_SOL
  API_SOL -->|"INSERT"| DB_SOL
  API_SOL -->|"sendSolicitudEmail"| EMAILS
  EMAILS --> ATC & TECN_EMAIL & ALMA & SOP & CC

  DB_SOL -->|"polling / Realtime"| TABLERO
  TABLERO -->|"Seleccionar ticket"| VISITA_PAGE
  VISITA_PAGE -->|"reclamar → en_proceso"| API_VIS
  VISITA_PAGE -->|"iniciar → foto llegada"| API_VIS
  VISITA_PAGE -->|"completar → firma digital"| API_VIS
  API_VIS -->|"INSERT / UPDATE"| DB_VIS
  API_VIS -->|"estado = resuelto"| DB_SOL

  ADM_DASH --> ADM_SOL & ADM_MAQ & ADM_CLI & ADM_TEC & ADM_LIVE & ADM_MET & ADM_CONT & ADM_REP
  ADM_SOL -->|"Lee"| DB_SOL
  ADM_MET -->|"Lee"| DB_VIS
  ADM_MET -->|"Lee"| DB_SOL
  ADM_CONT -->|"UPSERT"| DB_LECT & DB_COB

  style CLIENTE fill:#e0f2fe,stroke:#0284c7
  style INGRESO fill:#fef9c3,stroke:#ca8a04
  style DEST_EMAIL fill:#fef9c3,stroke:#ca8a04
  style TECNICO fill:#dcfce7,stroke:#16a34a
  style ADMIN fill:#ede9fe,stroke:#7c3aed
  style DB_ADMIN fill:#fce7f3,stroke:#db2777
`

export default function DiagramaMermaid() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          fontSize: '13px',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        },
        flowchart: { curve: 'basis', padding: 20 },
      })

      mermaid
        .render('toncan-diagrama', DIAGRAMA.trim())
        .then(({ svg }) => {
          if (containerRef.current) containerRef.current.innerHTML = svg
        })
        .catch(err => {
          console.error('Mermaid render error:', err)
          setError('Error al renderizar el diagrama.')
        })
    })
  }, [])

  if (error) return <p className="text-red-500 text-sm p-8">{error}</p>

  return (
    <div
      ref={containerRef}
      className="w-full overflow-auto flex justify-center py-4 [&_svg]:max-w-full [&_svg]:h-auto"
    />
  )
}
