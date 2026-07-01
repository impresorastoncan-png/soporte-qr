import {
  Html, Head, Body, Container, Section,
  Text, Hr, Link,
} from '@react-email/components'
import { urgenciaConfig } from '@/lib/utils'
import type { Urgencia } from '@/lib/supabase/types'

interface ConfirmacionClienteEmailProps {
  ticketId: string
  fecha: string
  clienteNombre: string
  ubicacion: string
  modelo: string
  nombreSolicitante: string
  urgencia: Urgencia
}

export function ConfirmacionClienteEmail({
  ticketId,
  fecha,
  clienteNombre,
  ubicacion,
  modelo,
  nombreSolicitante,
  urgencia,
}: ConfirmacionClienteEmailProps) {
  const urg = urgenciaConfig[urgencia]

  return (
    <Html lang="es">
      <Head />
      <Body style={{ backgroundColor: '#f4f4f4', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <div style={{ backgroundColor: '#295536', height: '6px', width: '100%' }} />

        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
          {/* Header */}
          <Section style={{ padding: '24px 32px', textAlign: 'center', backgroundColor: '#162f52' }}>
            <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
              TONCAN DIGITAL, C.A.
            </Text>
            <Text style={{ color: '#a0b4c8', fontSize: '13px', margin: '0 0 16px 0' }}>
              Confirmación de Solicitud de Soporte
            </Text>
            <Text style={{ color: '#cbd5e1', fontSize: '12px', margin: 0 }}>
              {ticketId} · {fecha}
            </Text>
          </Section>

          {/* Saludo */}
          <Section style={{ padding: '28px 32px 0' }}>
            <Text style={{ fontSize: '16px', color: '#1f2937', margin: '0 0 12px 0' }}>
              Estimado/a <strong>{nombreSolicitante}</strong>,
            </Text>
            <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: 0 }}>
              Su solicitud de soporte técnico ha sido recibida exitosamente y se encuentra siendo
              canalizada por nuestro equipo. Un técnico de <strong>Toncan Digital</strong> estará en
              vía próximamente para atender su reporte.
            </Text>
          </Section>

          {/* Número de ticket destacado */}
          <Section style={{ padding: '24px 32px' }}>
            <div style={{
              backgroundColor: '#f0f4ff',
              border: '2px solid #162f52',
              borderRadius: '10px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <Text style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 6px 0', letterSpacing: '1px' }}>
                Número de ticket
              </Text>
              <Text style={{ fontSize: '28px', fontFamily: 'monospace', fontWeight: 'bold', color: '#162f52', margin: 0 }}>
                {ticketId}
              </Text>
              <Text style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0 0' }}>
                Conserve este número para cualquier consulta futura
              </Text>
            </div>
          </Section>

          {/* Detalles del reporte */}
          <Section style={{ padding: '0 32px' }}>
            <Text style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 10px 0', letterSpacing: '1px' }}>
              Detalles de su solicitud
            </Text>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', width: '35%', backgroundColor: '#f9fafb' }}>Cliente</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: '#1f2937' }}>{clienteNombre}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', backgroundColor: '#f9fafb' }}>Ubicación</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: '#1f2937' }}>{ubicacion}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', backgroundColor: '#f9fafb' }}>Equipo</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: '#1f2937' }}>{modelo}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', backgroundColor: '#f9fafb' }}>Urgencia</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: '#1f2937' }}>
                    {urg.emoji} {urg.label}
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Mensaje de próximos pasos */}
          <Section style={{ padding: '20px 32px' }}>
            <div style={{ backgroundColor: '#f0fdf4', borderLeft: '4px solid #295536', padding: '16px', borderRadius: '4px' }}>
              <Text style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', margin: '0 0 6px 0' }}>
                ¿Qué sucede ahora?
              </Text>
              <Text style={{ fontSize: '13px', color: '#15803d', margin: '0 0 4px 0', lineHeight: '1.6' }}>
                • Nuestro equipo de soporte ha sido notificado y está coordinando la visita técnica.
              </Text>
              <Text style={{ fontSize: '13px', color: '#15803d', margin: '0 0 4px 0', lineHeight: '1.6' }}>
                • El técnico asignado se comunicará con usted para coordinar la atención.
              </Text>
              <Text style={{ fontSize: '13px', color: '#15803d', margin: 0, lineHeight: '1.6' }}>
                • En caso de cualquier duda, contáctenos con su número de ticket.
              </Text>
            </div>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '0 32px' }} />

          {/* Footer */}
          <Section style={{ padding: '16px 32px', backgroundColor: '#f9fafb' }}>
            <Text style={{ fontSize: '13px', color: '#374151', textAlign: 'center', margin: '0 0 8px 0' }}>
              Agradecemos su confianza en <strong>Toncan Digital, C.A.</strong>
            </Text>
            <Text style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: 0 }}>
              Para más información:{' '}
              <Link href="mailto:soporte@toncandigital.com" style={{ color: '#162f52' }}>
                soporte@toncandigital.com
              </Link>{' '}
              · 0212 2851926 / 7404501
            </Text>
          </Section>

          <div style={{ backgroundColor: '#73262f', height: '4px', width: '100%' }} />
        </Container>
      </Body>
    </Html>
  )
}
