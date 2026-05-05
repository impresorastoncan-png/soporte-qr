'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'

type ContadorRow = {
  item: number
  modelo: string
  tipo: string
  serial: string
  ubicacion: string
  lectAnterior: number
  lectActual: number
  diferencia: number
}

type ClienteInfo = {
  razon_social: string
  rif: string
  direccion: string
  atc: string
  tarifa_bn_usd: number
  tarifa_color_usd: number
  copiado_minimo: number
  tarifa_fija_usd: number
}

const MESES_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function GenerarReporte({
  cliente,
  rows,
  periodo,
  tasaBcv,
  fechaTasa,
  costoPorCopia,
  totalCopias,
  copiadoMinimo,
  tarifaFija,
  aplicaMinimo,
}: {
  cliente: ClienteInfo
  rows: ContadorRow[]
  periodo: string
  tasaBcv: number
  fechaTasa: string
  costoPorCopia: number
  totalCopias: number
  copiadoMinimo: number
  tarifaFija: number
  aplicaMinimo: boolean
}) {
  const [generando, setGenerando] = useState(false)

  const baseUsd = aplicaMinimo ? tarifaFija : totalCopias * costoPorCopia
  const ivaPct = 16
  const ivaUsd = baseUsd * (ivaPct / 100)
  const totalUsd = baseUsd + ivaUsd
  const baseBs = baseUsd * tasaBcv
  const ivaBs = ivaUsd * tasaBcv
  const totalBs = totalUsd * tasaBcv

  const [anio, mes] = periodo.split('-').map(Number)
  const mesNombre = MESES_FULL[mes - 1] ?? ''

  async function descargarPdf() {
    setGenerando(true)
    try {
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.default ?? jsPDFModule.jsPDF
      const autoTableModule = await import('jspdf-autotable')
      const autoTable = autoTableModule.default ?? autoTableModule

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc: any = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Logo placeholder (texto estilizado)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(22, 47, 82) // #162f52
      doc.text('Toncan', pageWidth - 55, 15)
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text('Digital, C.A.', pageWidth - 55, 21)

      // Titulo
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'bold')
      doc.text('RELACION ANEXA', 14, 15)

      // Info del cliente
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      let y = 25

      doc.setFont('helvetica', 'bold')
      doc.text('Cliente:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(cliente.razon_social, 40, y)

      y += 5
      doc.setFont('helvetica', 'bold')
      doc.text('RIF:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(cliente.rif, 40, y)

      y += 5
      doc.setFont('helvetica', 'bold')
      doc.text('Ubicacion:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(cliente.direccion || '', 40, y)

      y += 5
      doc.setFont('helvetica', 'bold')
      doc.text('Periodo:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`${mesNombre} ${anio}`, 40, y)

      // Info lateral derecha
      doc.setFont('helvetica', 'bold')
      doc.text('Pagina:', pageWidth - 55, 30)
      doc.setFont('helvetica', 'normal')
      doc.text('1', pageWidth - 38, 30)

      y += 8

      // Tabla de contadores
      const tableData = rows.map(r => [
        r.item,
        r.ubicacion,
        r.modelo,
        r.serial,
        r.lectAnterior.toLocaleString('es-VE'),
        r.lectActual.toLocaleString('es-VE'),
        r.diferencia.toLocaleString('es-VE'),
      ])

      autoTable(doc, {
        startY: y,
        head: [['N°', 'Ubicacion', 'Modelo', 'Serial', 'Lect. ant', 'Lect. actual', 'Diferencia']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [22, 47, 82], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
      })

      // Resumen debajo de la tabla
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable?.finalY ?? y + 40
      let ry = finalY + 8

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Total No de Copias', 14, ry)
      doc.setFont('helvetica', 'normal')
      doc.text(totalCopias.toLocaleString('es-VE'), 120, ry, { align: 'right' })

      ry += 5
      if (copiadoMinimo > 0) {
        doc.setFont('helvetica', 'bold')
        doc.text('Copiado Minimo Global', 14, ry)
        doc.setFont('helvetica', 'normal')
        doc.text(copiadoMinimo.toLocaleString('es-VE'), 120, ry, { align: 'right' })
        ry += 5
      }

      if (aplicaMinimo) {
        doc.setFont('helvetica', 'bold')
        doc.text('Tarifa Fija (no alcanza minimo)', 14, ry)
        doc.setFont('helvetica', 'normal')
        doc.text(`$${tarifaFija.toFixed(2)}`, 120, ry, { align: 'right' })
        ry += 5
      } else {
        doc.setFont('helvetica', 'bold')
        doc.text(`${totalCopias.toLocaleString('es-VE')} copias x $${costoPorCopia.toFixed(4)}`, 14, ry)
        doc.setFont('helvetica', 'normal')
        doc.text(`$${baseUsd.toFixed(2)}`, 120, ry, { align: 'right' })
        ry += 5
      }

      doc.setFont('helvetica', 'bold')
      doc.text('TOTAL', 14, ry)
      doc.text(`$${baseUsd.toFixed(2)}`, 120, ry, { align: 'right' })

      // Seccion de facturacion en Bs
      ry += 10
      doc.setDrawColor(200, 200, 200)
      doc.line(14, ry - 3, 140, ry - 3)

      doc.setFont('helvetica', 'bold')
      doc.text('Base', 14, ry)
      doc.setFont('helvetica', 'normal')
      doc.text(`${baseBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs`, 120, ry, { align: 'right' })

      ry += 5
      doc.setFont('helvetica', 'bold')
      doc.text(`IVA ${ivaPct}%`, 14, ry)
      doc.setFont('helvetica', 'normal')
      doc.text(`${ivaBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs`, 120, ry, { align: 'right' })

      ry += 5
      doc.setFont('helvetica', 'bold')
      doc.text('Total Factura', 14, ry)
      doc.text(`${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs`, 120, ry, { align: 'right' })

      ry += 5
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text(`Tasa Cambio del dia ${fechaTasa} — Publicada por BCV`, 14, ry)

      // Footer
      doc.setFontSize(7)
      doc.setTextColor(160, 160, 160)
      doc.text('Por Computacion Toncan Digital, C.A.', 14, pageHeight - 8)

      const fileName = `Relacion_Anexa_${cliente.razon_social.replace(/[^a-zA-Z0-9]/g, '_')}_${periodo}.pdf`
      doc.save(fileName)
    } catch (err) {
      console.error('Error generando PDF:', err)
      alert('Error al generar el PDF. Revise la consola.')
    }
    setGenerando(false)
  }

  function descargarExcel() {
    const data = rows.map(r => ({
      'N°': r.item,
      'Ubicacion': r.ubicacion,
      'Modelo': r.modelo,
      'Serial': r.serial,
      'Lect. Anterior': r.lectAnterior,
      'Lect. Actual': r.lectActual,
      'Diferencia': r.diferencia,
    }))

    // Agregar filas de resumen
    data.push(
      { 'N°': 0, 'Ubicacion': '', 'Modelo': '', 'Serial': '', 'Lect. Anterior': 0, 'Lect. Actual': 0, 'Diferencia': 0 } as typeof data[0],
      { 'N°': 0, 'Ubicacion': 'Total No de Copias', 'Modelo': '', 'Serial': '', 'Lect. Anterior': 0, 'Lect. Actual': 0, 'Diferencia': totalCopias } as typeof data[0],
    )

    if (copiadoMinimo > 0) {
      data.push({ 'N°': 0, 'Ubicacion': 'Copiado Minimo Global', 'Modelo': '', 'Serial': '', 'Lect. Anterior': 0, 'Lect. Actual': 0, 'Diferencia': copiadoMinimo } as typeof data[0])
    }

    if (aplicaMinimo) {
      data.push({ 'N°': 0, 'Ubicacion': `Tarifa Fija (no alcanza minimo)`, 'Modelo': '', 'Serial': `$${tarifaFija.toFixed(2)}`, 'Lect. Anterior': 0, 'Lect. Actual': 0, 'Diferencia': 0 } as typeof data[0])
    } else {
      data.push({ 'N°': 0, 'Ubicacion': `${totalCopias} copias x $${costoPorCopia.toFixed(4)}`, 'Modelo': '', 'Serial': `$${baseUsd.toFixed(2)}`, 'Lect. Anterior': 0, 'Lect. Actual': 0, 'Diferencia': 0 } as typeof data[0])
    }

    data.push(
      { 'N°': 0, 'Ubicacion': '', 'Modelo': '', 'Serial': '', 'Lect. Anterior': 0, 'Lect. Actual': 0, 'Diferencia': 0 } as typeof data[0],
      { 'N°': 0, 'Ubicacion': 'Base USD', 'Modelo': '', 'Serial': `$${baseUsd.toFixed(2)}`, 'Lect. Anterior': 0, 'Lect. Actual': 0, 'Diferencia': 0 } as typeof data[0],
      { 'N°': 0, 'Ubicacion': `IVA ${ivaPct}%`, 'Modelo': '', 'Serial': `$${ivaUsd.toFixed(2)}`, 'Lect. Anterior': 0, 'Lect. Actual': 0, 'Diferencia': 0 } as typeof data[0],
      { 'N°': 0, 'Ubicacion': 'Total Factura Bs', 'Modelo': '', 'Serial': `${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs`, 'Lect. Anterior': 0, 'Lect. Actual': 0, 'Diferencia': 0 } as typeof data[0],
      { 'N°': 0, 'Ubicacion': `Tasa BCV: ${tasaBcv}`, 'Modelo': '', 'Serial': fechaTasa, 'Lect. Anterior': 0, 'Lect. Actual': 0, 'Diferencia': 0 } as typeof data[0],
    )

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Relacion Anexa')

    // Header info
    XLSX.utils.sheet_add_aoa(ws, [
      ['Cliente:', cliente.razon_social],
      ['RIF:', cliente.rif],
      ['Periodo:', `${mesNombre} ${anio}`],
      [''],
    ], { origin: 'I1' })

    const fileName = `Relacion_Anexa_${cliente.razon_social.replace(/[^a-zA-Z0-9]/g, '_')}_${periodo}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={descargarPdf}
        disabled={generando}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: '#162f52' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {generando ? 'Generando...' : 'PDF'}
      </button>
      <button
        onClick={descargarExcel}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-green-700 hover:bg-green-800"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Excel
      </button>
    </div>
  )
}
