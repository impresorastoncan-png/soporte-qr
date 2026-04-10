import {
  Html, Head, Body, Container, Section, Row, Column,
  Text, Img, Hr, Link,
} from '@react-email/components'
import { urgenciaConfig } from '@/lib/utils'
import type { Urgencia } from '@/lib/supabase/types'

interface SolicitudEmailProps {
  ticketId: string
  fecha: string
  clienteNombre: string
  ubicacion: string
  modelo: string
  serial: string
  tecnicosEmails: string[]
  encargadoEmail?: string | null
  correoSolicitante?: string | null
  urgencia: Urgencia
  necesitaToner: boolean
  tipoProblema?: string | null
  descripcion: string
  fotosUrls?: string[] | null
}

export function SolicitudEmail({
  ticketId,
  fecha,
  clienteNombre,
  ubicacion,
  modelo,
  serial,
  tecnicosEmails,
  encargadoEmail,
  correoSolicitante,
  urgencia,
  necesitaToner,
  tipoProblema,
  descripcion,
  fotosUrls,
}: SolicitudEmailProps) {
  const urg = urgenciaConfig[urgencia]

  return (
    <Html lang="es">
      <Head />
      <Body style={{ backgroundColor: '#f4f4f4', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        {/* Barra verde superior */}
        <div style={{ backgroundColor: '#295536', height: '6px', width: '100%' }} />

        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
          {/* Header */}
          <Section style={{ padding: '24px 32px', textAlign: 'center', backgroundColor: '#162f52' }}>
            <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
              TONCAN DIGITAL, C.A.
            </Text>
            <Text style={{ color: '#a0b4c8', fontSize: '13px', margin: '0 0 16px 0' }}>
              Solicitud de Insumos y Servicios
            </Text>
            <Text style={{ color: '#cbd5e1', fontSize: '12px', margin: 0 }}>
              {ticketId} · {fecha}
            </Text>
          </Section>

          {/* Banda de urgencia */}
          <Section style={{ backgroundColor: urg.color, padding: '12px 32px' }}>
            <Text style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', margin: 0, textAlign: 'center' }}>
              {urg.emoji} URGENCIA: {urg.label.toUpperCase()}
            </Text>
          </Section>

          {/* Tabla de datos */}
          <Section style={{ padding: '0 32px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
              <tbody>
                <DataRow label="CLIENTE" value={clienteNombre} />
                <DataRow label="UBICACIÓN" value={ubicacion} />
                <DataRow label="MODELO" value={modelo} />
                <DataRow label="SERIAL" value={serial} mono />
                <DataRow label="TÉCNICO(S)" value={tecnicosEmails.join(', ') || 'Sin técnico asignado'} />
                {encargadoEmail && <DataRow label="ENCARGADO" value={encargadoEmail} />}
                {correoSolicitante && <DataRow label="CORREO SOL." value={correoSolicitante} />}
                <DataRow
                  label="TÓNER"
                  value={necesitaToner ? '⚠️ SÍ — Requiere tóner' : 'No requiere'}
                  highlight={necesitaToner}
                />
                {tipoProblema && <DataRow label="TIPO" value={tipoProblema} />}
              </tbody>
            </table>
          </Section>

          {/* Descripción */}
          <Section style={{ padding: '16px 32px' }}>
            <div style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #162f52', padding: '16px', borderRadius: '4px' }}>
              <Text style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                Falla Reportada
              </Text>
              <Text style={{ fontSize: '14px', color: '#1f2937', margin: 0, lineHeight: '1.6' }}>
                {descripcion}
              </Text>
            </div>
          </Section>

          {/* Fotos */}
          {fotosUrls && fotosUrls.length > 0 && (
            <Section style={{ padding: '0 32px 16px' }}>
              <Text style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                Fotos adjuntas
              </Text>
              {fotosUrls.map((url, i) => (
                <Img
                  key={i}
                  src={url}
                  alt={`Foto ${i + 1}`}
                  style={{ maxWidth: '100%', borderRadius: '4px', marginBottom: '8px', display: 'block' }}
                />
              ))}
            </Section>
          )}

          <Hr style={{ borderColor: '#e5e7eb', margin: '0 32px' }} />

          {/* Footer info */}
          <Section style={{ padding: '16px 32px', backgroundColor: '#f9fafb' }}>
            <Text style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: 0 }}>
              Para más información:{' '}
              <Link href="mailto:gerenciaatc@toncandigital.com" style={{ color: '#162f52' }}>
                gerenciaatc@toncandigital.com
              </Link>{' '}
              · (0212) 735 1960/1961
            </Text>
          </Section>

          {/* Barra roja inferior */}
          <div style={{ backgroundColor: '#73262f', height: '4px', width: '100%' }} />
        </Container>
      </Body>
    </Html>
  )
}

function DataRow({ label, value, mono, highlight }: {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
      <td style={{
        padding: '10px 12px',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#6b7280',
        textTransform: 'uppercase',
        width: '35%',
        verticalAlign: 'top',
        backgroundColor: '#f9fafb',
      }}>
        {label}
      </td>
      <td style={{
        padding: '10px 12px',
        fontSize: '13px',
        color: highlight ? '#CC0000' : '#1f2937',
        fontWeight: highlight ? 'bold' : 'normal',
        fontFamily: mono ? 'monospace' : 'inherit',
      }}>
        {value}
      </td>
    </tr>
  )
}
