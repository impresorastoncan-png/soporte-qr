import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToFile } from '@react-pdf/renderer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(__dirname, '..', 'docs', 'manual-toncan-qr.pdf')
const h = React.createElement

const NAVY = '#162f52'
const GRAY_500 = '#6b7280'
const GRAY_700 = '#374151'
const GRAY_100 = '#f3f4f6'
const GRAY_200 = '#e5e7eb'

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 55,
    fontSize: 10.5,
    fontFamily: 'Helvetica',
    color: '#111',
    lineHeight: 1.5,
  },
  cover: {
    padding: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NAVY,
  },
  coverInner: {
    paddingHorizontal: 60,
    flexDirection: 'column',
    alignItems: 'center',
  },
  coverKicker: {
    fontSize: 11,
    color: '#94a3b8',
    letterSpacing: 3,
    marginBottom: 24,
    fontFamily: 'Helvetica-Bold',
  },
  coverTitle: {
    fontSize: 38,
    fontFamily: 'Helvetica-Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 1.1,
  },
  coverSubtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 8,
  },
  coverFooter: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#64748b',
  },
  partHeader: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 3,
    borderBottomColor: NAVY,
    borderBottomStyle: 'solid',
  },
  partKicker: {
    fontSize: 10,
    color: GRAY_500,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  partTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },
  h2: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginTop: 18,
    marginBottom: 6,
  },
  h3: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_700,
    marginTop: 10,
    marginBottom: 4,
  },
  p: {
    marginBottom: 6,
    textAlign: 'justify',
  },
  li: {
    marginLeft: 14,
    marginBottom: 3,
    flexDirection: 'row',
  },
  liBullet: {
    width: 10,
    color: NAVY,
    fontFamily: 'Helvetica-Bold',
  },
  liText: {
    flex: 1,
  },
  numberedLi: {
    marginLeft: 14,
    marginBottom: 4,
    flexDirection: 'row',
  },
  numberedLiNum: {
    width: 16,
    color: NAVY,
    fontFamily: 'Helvetica-Bold',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  code: {
    fontFamily: 'Courier',
    fontSize: 9,
    backgroundColor: GRAY_100,
    padding: 6,
    marginVertical: 6,
    borderRadius: 3,
    color: '#0f172a',
  },
  inlineCode: {
    fontFamily: 'Courier',
    fontSize: 9.5,
    backgroundColor: GRAY_100,
    color: '#0f172a',
  },
  situation: {
    marginTop: 14,
    marginBottom: 4,
    padding: 8,
    backgroundColor: '#eef2ff',
    borderLeftWidth: 3,
    borderLeftColor: NAVY,
    borderLeftStyle: 'solid',
  },
  situationLabel: {
    fontSize: 9,
    color: NAVY,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  situationTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },
  faqQ: {
    marginTop: 8,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    fontSize: 10.5,
  },
  faqA: {
    marginBottom: 6,
    marginTop: 2,
    color: GRAY_700,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    color: GRAY_500,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 55,
    right: 55,
    textAlign: 'right',
    fontSize: 8,
    color: GRAY_500,
    borderTopWidth: 0.5,
    borderTopColor: GRAY_200,
    borderTopStyle: 'solid',
    paddingTop: 6,
  },
})

const P = (...children) => h(Text, { style: styles.p }, ...children)
const H2 = (text) => h(Text, { style: styles.h2 }, text)
const H3 = (text) => h(Text, { style: styles.h3 }, text)
const B = (text) => h(Text, { style: styles.bold }, text)
const Code = (text) => h(View, null, h(Text, { style: styles.code }, text))
const Ic = (text) => h(Text, { style: styles.inlineCode }, text)

const Li = (children) =>
  h(View, { style: styles.li },
    h(Text, { style: styles.liBullet }, '•'),
    h(Text, { style: styles.liText }, children)
  )

const NLi = (n, children) =>
  h(View, { style: styles.numberedLi },
    h(Text, { style: styles.numberedLiNum }, `${n}.`),
    h(Text, { style: styles.liText }, children)
  )

const Situation = (num, title) =>
  h(View, { style: styles.situation, wrap: false },
    h(Text, { style: styles.situationLabel }, `SITUACIÓN ${num}`),
    h(Text, { style: styles.situationTitle }, title)
  )

const Footer = (label) =>
  h(Text, {
    style: styles.footer,
    fixed: true,
    render: ({ pageNumber, totalPages }) =>
      `Toncan Digital · ${label}   —   ${pageNumber} / ${totalPages}`
  })

// ── CONTENIDO ────────────────────────────────────────────────────────────────

const cover = h(Page, { size: 'A4', style: [styles.page, styles.cover] },
  h(View, { style: styles.coverInner },
    h(Text, { style: styles.coverKicker }, 'TONCAN DIGITAL'),
    h(Text, { style: styles.coverTitle }, 'Sistema de\nSoporte QR'),
    h(Text, { style: styles.coverSubtitle }, 'Manual técnico y guía de uso'),
  ),
  h(Text, { style: styles.coverFooter }, 'Versión 1.0  ·  Uso interno')
)

const tecnico = h(Page, { size: 'A4', style: styles.page },
  h(View, { style: styles.partHeader },
    h(Text, { style: styles.partKicker }, 'PARTE I'),
    h(Text, { style: styles.partTitle }, 'Manual Técnico')
  ),

  H2('1. Visión general'),
  P('El Sistema de Soporte QR es una aplicación web desarrollada para Corporación Toncan Digital que reemplaza el flujo anterior basado en Google Forms, Google Sheets y Apps Script. El objetivo es permitir que cualquier usuario de un cliente corporativo pueda reportar una falla en una impresora Canon iR-ADVance en menos de 30 segundos, y que esa solicitud llegue automáticamente a las personas correctas dentro de Toncan.'),
  P('Flujo principal de una solicitud:'),
  NLi(1, 'El usuario final escanea el sticker QR pegado en la impresora.'),
  NLi(2, 'Se abre el formulario público en su navegador móvil, ya precargado con el serial, modelo, cliente y ubicación de esa máquina.'),
  NLi(3, 'El usuario llena los datos (urgencia, tipo de problema, descripción, si necesita tóner) y opcionalmente adjunta hasta 3 fotos.'),
  NLi(4, 'Al enviar, la solicitud se registra en la base de datos con un ticket ID único.'),
  NLi(5, 'El sistema envía un correo automático a los destinatarios correspondientes: ATC del cliente, técnicos asignados, encargado (si aplica), almacén si necesita tóner, y gerencia técnica si la urgencia es crítica.'),
  NLi(6, 'El personal de Toncan ve la solicitud en tiempo real en el panel administrativo y en el wallboard.'),

  H2('2. Stack técnico'),
  Li(h(Text, null, B('Next.js 16.2.3'), ' — framework React con App Router y Turbopack.')),
  Li(h(Text, null, B('React 19'), ' — versión con Server Components, Server Actions y useActionState.')),
  Li(h(Text, null, B('Supabase'), ' — PostgreSQL administrado con autenticación, storage y realtime incluidos.')),
  Li(h(Text, null, B('Resend + React Email'), ' — envío transaccional de correos con templates tipados.')),
  Li(h(Text, null, B('Tailwind CSS v4'), ' — estilos utilitarios.')),
  Li(h(Text, null, B('TypeScript 5'), ' — tipado estricto en todo el proyecto.')),
  Li(h(Text, null, B('Zod'), ' — validación runtime del payload de la API.')),
  Li(h(Text, null, B('xlsx (SheetJS)'), ' — parsing de Excel en el navegador para importación masiva.')),
  Li(h(Text, null, B('react-qr-code'), ' — render SVG de códigos QR.')),
  Li(h(Text, null, B('@react-pdf/renderer'), ' — generación de PDFs (stickers, manuales).')),
  P(' '),
  P('Vale la pena destacar que Next.js 16 trae cambios importantes respecto a versiones anteriores: el archivo middleware.ts fue renombrado a proxy.ts con función proxy, y tanto params como searchParams ahora son Promesas que hay que await. Estos cambios están ya aplicados en el proyecto.'),

  H2('3. Estructura del proyecto'),
  P('La raíz del proyecto sigue convenciones de Next.js App Router:'),
  Li(h(Text, null, Ic('app/'), ' — rutas de la aplicación, cada carpeta es una ruta.')),
  Li(h(Text, null, Ic('app/soporte/[serial]/'), ' — formulario público que se abre al escanear el QR.')),
  Li(h(Text, null, Ic('app/api/soporte/'), ' — endpoint POST que recibe el formulario y crea la solicitud.')),
  Li(h(Text, null, Ic('app/admin/login/'), ' — página de autenticación administrativa.')),
  Li(h(Text, null, Ic('app/admin/live/'), ' — wallboard en vivo a pantalla completa.')),
  Li(h(Text, null, Ic('app/admin/(dashboard)/'), ' — grupo de rutas que comparten el layout con sidebar.')),
  Li(h(Text, null, Ic('lib/'), ' — código compartido: clientes Supabase, envío de correo, validaciones y utilidades.')),
  Li(h(Text, null, Ic('components/'), ' — componentes React: primitivos de UI del panel admin y el template de correo.')),
  Li(h(Text, null, Ic('proxy.ts'), ' — middleware de Next.js 16 que protege las rutas /admin/* y redirige al login cuando no hay sesión.')),
  Li(h(Text, null, Ic('supabase_schema.md'), ' — documentación versionada de todas las migraciones SQL del proyecto.')),

  Footer('Manual técnico')
)

const tecnico2 = h(Page, { size: 'A4', style: styles.page },
  H2('4. Base de datos'),
  P('El esquema PostgreSQL está compuesto por cinco tablas principales más una vista de conveniencia. Todas las tablas tienen Row Level Security activado con políticas específicas.'),
  H3('clientes'),
  P('Empresas corporativas que arriendan impresoras. Campos clave: nombre, RIF, direccion, atc_email (correo del ATC asignado a ese cliente), activo, y es_almacen que distingue los almacenes internos de Toncan (CTD QTA, CTD L4) de los clientes reales.'),
  H3('tecnicos'),
  P('Personal técnico de Toncan. Nombre, email y estado activo.'),
  H3('maquinas'),
  P('La flota de impresoras. Cada máquina tiene un serial único (el número de fábrica Canon que se usa en el URL del QR), modelo, cliente asignado, ubicación dentro del cliente, correo del encargado (opcional), y estado activo.'),
  H3('maquina_tecnicos'),
  P('Tabla M:N que asigna uno o más técnicos a cada máquina. Se usa para incluirlos como destinatarios de los correos de solicitud.'),
  H3('solicitudes'),
  P('El registro de cada reporte entrante. Contiene los datos del formulario (urgencia, tipo de problema, descripción, fotos), un snapshot del cliente_nombre y modelo/ubicación de la máquina en el momento del reporte, el ticket_id generado, y el estado actual (pendiente, en_proceso, resuelto).'),
  P('La vista v_maquinas_detalle hace el JOIN entre máquinas y clientes más un array_agg de los correos de técnicos asignados, para que el backend pueda construir la lista de destinatarios con una sola query.'),

  H2('5. Variables de entorno'),
  P('Todas se configuran en .env.local en desarrollo y en el dashboard de Vercel en producción:'),
  Li(h(Text, null, B('NEXT_PUBLIC_APP_URL'), ' — base URL de la aplicación. Se usa para construir las URLs que codifican los códigos QR.')),
  Li(h(Text, null, B('NEXT_PUBLIC_SUPABASE_URL'), ' — URL del proyecto Supabase.')),
  Li(h(Text, null, B('NEXT_PUBLIC_SUPABASE_ANON_KEY'), ' — clave pública para el cliente del navegador (respeta RLS).')),
  Li(h(Text, null, B('SUPABASE_SERVICE_ROLE_KEY'), ' — clave de servicio para operaciones backend. Nunca debe exponerse al cliente.')),
  Li(h(Text, null, B('RESEND_API_KEY'), ' — API key de Resend para envío de correos.')),
  Li(h(Text, null, B('EMAIL_FROM'), ' — remitente de los correos. En sandbox se usa onboarding@resend.dev.')),
  Li(h(Text, null, B('EMAIL_ATC, EMAIL_ALMACEN, EMAIL_GERENTE_TEC'), ' — direcciones de respaldo para destinos corporativos.')),

  H2('6. Flujo de una solicitud end-to-end'),
  P('Cuando un usuario escanea un QR, la URL /soporte/[serial] es manejada por un server component que busca la máquina en la base de datos, carga los datos del cliente y renderiza el formulario. Si la máquina no existe o está inactiva, muestra un mensaje de error.'),
  P('Al enviar el formulario:'),
  NLi(1, 'El cliente sube las fotos primero al bucket solicitudes-fotos de Supabase Storage.'),
  NLi(2, 'Con los URLs de las fotos ya obtenidos, hace POST a /api/soporte con el resto del payload.'),
  NLi(3, 'El endpoint valida con Zod, consulta la máquina (con su cliente y técnicos), construye la lista deduplicada de destinatarios, inserta la fila en solicitudes con un ticket_id generado, y llama a sendSolicitudEmail.'),
  NLi(4, 'sendSolicitudEmail renderiza el template React Email con los datos de la solicitud y usa Resend para enviarlo. El envío está envuelto en try/catch para que un fallo en el correo no bloquee la creación de la solicitud.'),
  NLi(5, 'El cliente recibe la respuesta con el ticket_id y redirige al usuario a la página de agradecimiento.'),
  P('Simultáneamente, cualquier navegador que tenga /admin/live abierto recibirá el INSERT en tiempo real vía el canal Supabase Realtime y mostrará la nueva solicitud en el wallboard sin necesidad de recargar.'),

  Footer('Manual técnico')
)

const tecnico3 = h(Page, { size: 'A4', style: styles.page },
  H2('7. Autenticación y permisos'),
  P('El panel administrativo usa Supabase Auth con email/password. El middleware proxy.ts verifica la sesión para cualquier ruta bajo /admin/* y redirige a /admin/login si no hay usuario. El layout del grupo (dashboard) hace una verificación adicional en el servidor para proteger las páginas internas.'),
  P('Las Row Level Security policies de la base de datos garantizan que:'),
  Li('El cliente anónimo (rol anon, usado por el formulario público) solo puede leer máquinas activas y crear solicitudes.'),
  Li('El cliente autenticado (rol authenticated, usado por el panel admin) tiene acceso completo de lectura y escritura sobre todas las tablas.'),
  Li('El service role (usado por el backend para operaciones privilegiadas) hace bypass total de RLS.'),

  H2('8. Realtime'),
  P('El wallboard en /admin/live usa Supabase Realtime para recibir INSERT, UPDATE y DELETE de la tabla solicitudes vía websocket. Para que funcione, la tabla debe estar incluida en la publicación supabase_realtime, lo cual se hace con un ALTER PUBLICATION una sola vez (ver supabase_schema.md §13).'),
  P('El componente LiveBoard.tsx se suscribe al canal solicitudes-live al montarse y aplica los cambios en el estado local. Mantiene solo las solicitudes no resueltas ordenadas por urgencia y fecha. Cuando una solicitud pasa a estado resuelto, se remueve automáticamente del wallboard.'),

  H2('9. Deployment en Vercel'),
  P('El proyecto está listo para desplegarse en Vercel sin configuración adicional más allá de las variables de entorno. Los pasos:'),
  NLi(1, 'Conectar el repositorio de GitHub a un proyecto nuevo en Vercel.'),
  NLi(2, 'Copiar todas las variables de .env.local a Environment Variables en Vercel, excepto NEXT_PUBLIC_APP_URL.'),
  NLi(3, 'Hacer el primer deploy. Vercel entrega una URL del tipo soporte-qr-xxx.vercel.app.'),
  NLi(4, 'Agregar NEXT_PUBLIC_APP_URL con esa URL y hacer Redeploy para que los QRs apunten a producción.'),
  P(' '),
  P('Para producción real hay dos cambios pendientes: verificar el dominio toncandigital.com en Resend para poder enviar correos a direcciones reales (en sandbox solo se envían al dueño de la cuenta Resend), y apuntar un subdominio custom como soporte.toncandigital.com al proyecto Vercel.'),

  H2('10. Mantenimiento y troubleshooting'),
  H3('Nueva migración de base de datos'),
  P('Agregarla como nueva sección numerada en supabase_schema.md y correrla en el SQL Editor de Supabase. Nunca editar migraciones ya aplicadas.'),
  H3('El QR sigue funcionando aunque la máquina cambie de cliente'),
  P('Correcto, es el comportamiento diseñado. El QR codifica solo el serial; el resto de datos (cliente, ubicación, destinatarios del correo) se leen dinámicamente de la base de datos al momento del escaneo.'),
  H3('El wallboard no muestra nuevas solicitudes en vivo'),
  P('Verificar que el SQL de la §13 de supabase_schema.md haya sido ejecutado y que el indicador del wallboard diga "En vivo" (punto verde). Si dice "Desconectado", refrescar la página.'),
  H3('Los correos no llegan'),
  P('Revisar los logs en el dashboard de Resend. En modo sandbox, solo llegan correos a la cuenta dueña del API key.'),

  Footer('Manual técnico')
)

const uso1 = h(Page, { size: 'A4', style: styles.page },
  h(View, { style: styles.partHeader },
    h(Text, { style: styles.partKicker }, 'PARTE II'),
    h(Text, { style: styles.partTitle }, 'Guía de uso para almacén')
  ),

  P('Esta guía está pensada para la persona de almacén que será la principal usuaria del sistema en el día a día: la que crea clientes, registra nuevas máquinas, las mueve entre ubicaciones y gestiona los reemplazos. Cada situación se explica como un procedimiento paso a paso.'),

  Situation(0, 'Acceso al sistema'),
  P('Para entrar al panel administrativo, abrir en el navegador la URL del sistema y hacer click en Iniciar sesión:'),
  Code('https://soporte.toncandigital.com/admin/login'),
  P('Ingresar el correo y contraseña proporcionados por el administrador. Una vez dentro, verás el menú lateral con todas las secciones del sistema. Si olvidas la contraseña, contactar al administrador del sistema para restablecerla.'),

  Situation(1, 'Agregar una nueva máquina a un cliente'),
  P('Usar este flujo cuando llega un equipo nuevo para un cliente específico y quieres registrarlo individualmente.'),
  NLi(1, 'En el sidebar, hacer click en Clientes.'),
  NLi(2, 'Buscar el cliente en la lista y entrar a su detalle.'),
  NLi(3, 'En la sección Máquinas, hacer click en Agregar máquina.'),
  NLi(4, 'Llenar el formulario con serial (número de fábrica Canon), modelo, ubicación dentro del cliente, opcionalmente correo del encargado, y marcar los técnicos asignados.'),
  NLi(5, 'Dejar marcada la casilla Máquina activa y guardar.'),
  P('La máquina ya puede recibir solicitudes. El serial debe ser único en todo el sistema.'),

  Situation(2, 'Importar varias máquinas desde Excel'),
  P('Usar este flujo cuando llega un cliente nuevo con su flota completa o cuando se va a cargar masivamente un listado.'),
  NLi(1, 'En Clientes, entrar al cliente destino.'),
  NLi(2, 'Hacer click en Importar Excel.'),
  NLi(3, 'Revisar el formato esperado. Las columnas reconocidas son: serial (obligatorio), modelo (obligatorio), ubicacion (opcional) y encargado_email (opcional).'),
  NLi(4, 'Seleccionar el archivo .xlsx o .xls desde tu computadora.'),
  NLi(5, 'El sistema muestra un preview con cada fila marcada como OK o con un error. Revisar.'),
  NLi(6, 'Hacer click en Importar N máquina(s). El resultado muestra cuántas se insertaron, cuántas se actualizaron y cuántas se omitieron.'),
  P(' '),
  P(B('Nota importante: '), 'si un serial del Excel ya existe en un almacén (CTD QTA o CTD L4), la importación lo mueve automáticamente al cliente destino. Esto facilita reasignar equipos que estaban retornados. Si un serial ya existe en otro cliente real, la fila se omite para prevenir asignaciones duplicadas.'),

  Footer('Guía de uso')
)

const uso2 = h(Page, { size: 'A4', style: styles.page },
  Situation(3, 'Imprimir el QR de una máquina individual'),
  P('Usar cuando necesitas el sticker de una sola máquina, por ejemplo al reemplazar un sticker dañado o al registrar una máquina nueva.'),
  NLi(1, 'Ir a Máquinas en el sidebar o al detalle del cliente.'),
  NLi(2, 'Click en Editar en la fila de la máquina.'),
  NLi(3, 'En la parte superior del formulario, click en Mostrar QR.'),
  NLi(4, 'Se muestra el código QR con el serial, modelo, cliente y la URL codificada.'),
  NLi(5, 'Click en Imprimir sticker. Se abre una ventana nueva con el sticker formateado a 96mm × 55mm.'),
  NLi(6, 'Usar Ctrl+P y seleccionar la impresora de etiquetas o papel adhesivo.'),

  Situation(4, 'Reemplazar una máquina en un cliente'),
  P('Este es uno de los flujos más importantes. Caso típico: se daña la impresora XWH04309 del cliente Empresa A, se la llevan al almacén de Toncan y en su lugar se instala la máquina XLJ04170 que estaba guardada.'),
  H3('Paso A — Retirar la máquina dañada al almacén'),
  NLi(1, 'Ir a Máquinas, buscar XWH04309, click en Editar.'),
  NLi(2, 'Hacer scroll hasta la sección Zona de peligro.'),
  NLi(3, 'En Retirar a almacén, seleccionar el almacén destino (CTD QTA o CTD L4).'),
  NLi(4, 'Click en Retirar y confirmar.'),
  P('La máquina queda marcada como inactiva, sin ubicación, y aparece ahora en la vista del almacén elegido. Su QR físico sigue siendo el mismo.'),
  H3('Paso B — Asignar la máquina de repuesto al cliente'),
  NLi(1, 'Ir al almacén donde está XLJ04170 (sección Almacenes en el sidebar).'),
  NLi(2, 'Entrar al almacén, buscar la máquina, click en Editar.'),
  NLi(3, 'En el formulario cambiar Cliente a Empresa A, actualizar Ubicación (ej. "Piso 2 · Administración"), y marcar Máquina activa.'),
  NLi(4, 'Guardar.'),
  P(' '),
  P(B('Resultado: '), 'el sticker QR que ya estaba pegado en XLJ04170 sigue siendo el mismo (nunca se reimprime), y a partir de ahora cuando alguien lo escanee, las solicitudes irán al ATC de Empresa A.'),
  P(B('El punto clave de este diseño es que los stickers QR viajan con la máquina, no con el cliente. '), 'Cada máquina física tiene su propio QR de por vida; lo único que cambia en el sistema es la asignación máquina → cliente.'),

  Footer('Guía de uso')
)

const uso3 = h(Page, { size: 'A4', style: styles.page },
  Situation(5, 'Mover una máquina de un cliente a otro'),
  P('Similar al reemplazo pero sin pasarla por el almacén. Se usa cuando se reubica directamente.'),
  NLi(1, 'Ir a Máquinas, click en Editar de la máquina.'),
  NLi(2, 'Cambiar el campo Cliente al nuevo destino.'),
  NLi(3, 'Actualizar Ubicación y, si aplica, Correo del encargado.'),
  NLi(4, 'Guardar.'),
  P('El QR no cambia. Las próximas solicitudes escaneadas llegarán al nuevo cliente.'),

  Situation(6, 'Retirar una máquina cuando vuelve a depósito'),
  P('Cuando un cliente termina el contrato o devuelve una máquina a Toncan y no va a ser reasignada de inmediato.'),
  NLi(1, 'Ir a Máquinas, click en Editar.'),
  NLi(2, 'Ir a Zona de peligro, opción Retirar a almacén.'),
  NLi(3, 'Seleccionar CTD QTA o CTD L4 según donde quede físicamente.'),
  NLi(4, 'Confirmar.'),
  P('La máquina queda en el almacén, inactiva, y puede reasignarse después o importarse de nuevo vía Excel cuando se defina su próximo destino.'),

  Situation(7, 'Eliminar una máquina permanentemente'),
  P('Solo usar cuando la máquina nunca va a volver (venta, baja definitiva) y no tiene solicitudes históricas registradas. Si tiene solicitudes, el sistema bloquea la eliminación para preservar el histórico, y habrá que usar Retirar a almacén en su lugar.'),
  NLi(1, h(Text, null, B('Opción rápida: '), 'en la tabla de máquinas, click en Eliminar en la fila de la máquina. Confirmar.')),
  NLi(2, h(Text, null, B('Opción desde el formulario: '), 'entrar a Editar la máquina, Zona de peligro, Eliminar máquina. Confirmar.')),
  P('Si aparece el error "No se puede eliminar: la máquina tiene solicitudes históricas", usar Retirar a almacén.'),

  Situation(8, 'Crear un cliente nuevo'),
  NLi(1, 'En el sidebar, Clientes, Nuevo cliente.'),
  NLi(2, 'Llenar nombre del cliente, RIF (opcional), dirección (opcional), ATC Email (el correo del ATC de Toncan asignado a ese cliente, es el destinatario principal de las solicitudes), y marcar Activo.'),
  NLi(3, 'Guardar.'),
  NLi(4, 'Luego registrar sus máquinas con Situación 1 o Situación 2.'),

  Footer('Guía de uso')
)

const uso4 = h(Page, { size: 'A4', style: styles.page },
  Situation(9, 'Ver las solicitudes entrantes'),
  NLi(1, 'En el sidebar, Solicitudes.'),
  NLi(2, 'La tabla muestra las últimas solicitudes ordenadas por fecha descendente.'),
  NLi(3, 'Usar los filtros de la parte superior para acotar: cliente, urgencia, estado, tóner, rango de fechas, o búsqueda libre por ticket, serial o nombre del solicitante.'),
  NLi(4, 'Click en cualquier fila abre el drawer de detalle con toda la información, descripción completa y fotos si las hay.'),

  Situation(10, 'Cambiar el estado de una solicitud'),
  NLi(1, 'Abrir la solicitud en Solicitudes haciendo click en su fila.'),
  NLi(2, 'En la parte inferior del drawer hay tres botones: Pendiente, En proceso, Resuelto.'),
  NLi(3, 'Click en el nuevo estado. El cambio se refleja de inmediato y también en el wallboard en vivo.'),
  P(' '),
  P(B('Flujo típico: '), 'una solicitud nueva entra como Pendiente. Cuando el técnico sale a atenderla, se marca En proceso. Una vez resuelta, se marca Resuelto y desaparece del wallboard.'),

  Situation(11, 'Usar el wallboard en vivo'),
  P('El wallboard en /admin/live está diseñado para mostrarse en una pantalla grande o TV del área técnica. Se actualiza en tiempo real sin necesidad de recargar.'),
  NLi(1, 'Entrar con las mismas credenciales del panel admin.'),
  NLi(2, 'En la barra superior del panel de Solicitudes, click en Vista en vivo. O ir directamente a /admin/live.'),
  NLi(3, 'La pantalla muestra todas las solicitudes no resueltas ordenadas por urgencia y fecha.'),
  NLi(4, 'Las solicitudes críticas pulsan en rojo para llamar la atención.'),
  NLi(5, 'El indicador En vivo en la esquina superior derecha debe estar verde pulsante.'),
  NLi(6, 'El botón Sonido ON/OFF activa un pitido cada vez que entra una solicitud crítica nueva. Hay que activarlo manualmente una vez por sesión por restricciones del navegador.'),
  NLi(7, 'Para salir, usar el enlace ← Salir arriba a la derecha o F11 para salir de pantalla completa.'),

  Situation(12, 'Eliminar una solicitud'),
  P('Solo se usa para limpiar solicitudes de prueba o registradas por error. Las solicitudes reales deben marcarse como Resuelto en lugar de eliminarse, para preservar el histórico.'),
  NLi(1, 'Abrir la solicitud en el drawer de detalle.'),
  NLi(2, 'En la parte inferior, click en el enlace rojo Eliminar solicitud.'),
  NLi(3, 'Confirmar. La solicitud se borra permanentemente.'),

  Footer('Guía de uso')
)

const faq = h(Page, { size: 'A4', style: styles.page },
  h(View, { style: styles.partHeader },
    h(Text, { style: styles.partKicker }, 'ANEXO'),
    h(Text, { style: styles.partTitle }, 'Preguntas frecuentes')
  ),

  h(Text, { style: styles.faqQ }, '¿Qué pasa si un usuario escanea el QR de una máquina que no existe en el sistema?'),
  h(Text, { style: styles.faqA }, 'El formulario muestra un mensaje de error "Equipo no encontrado" y no permite enviar la solicitud. Hay que registrar esa máquina primero.'),

  h(Text, { style: styles.faqQ }, '¿Puedo reasignar la misma máquina varias veces sin perder el histórico?'),
  h(Text, { style: styles.faqA }, 'Sí. Cada vez que se mueve una máquina entre clientes, las solicitudes antiguas conservan el snapshot del cliente que tenían en el momento de ser creadas, así que el histórico es consistente.'),

  h(Text, { style: styles.faqQ }, '¿Por qué el botón Eliminar a veces dice que no puede eliminar?'),
  h(Text, { style: styles.faqA }, 'Porque la máquina tiene solicitudes históricas asociadas. Esto es una protección para no perder registros. Usa "Retirar a almacén" en su lugar.'),

  h(Text, { style: styles.faqQ }, '¿Cuántas fotos pueden adjuntar los usuarios finales al reportar una falla?'),
  h(Text, { style: styles.faqA }, 'Hasta 3 fotos por solicitud, de máximo 5 MB cada una, en formatos JPG, PNG o WebP.'),

  h(Text, { style: styles.faqQ }, '¿Quién recibe los correos de una solicitud?'),
  h(Text, { style: styles.faqA }, 'Dependiendo de los datos configurados: el ATC del cliente, los técnicos asignados a esa máquina, el encargado del cliente (si se configuró en la máquina), y adicionalmente el almacén si la solicitud marca "necesita tóner" y la gerencia técnica si la urgencia es Crítica. Los correos se deduplican, así que si una persona aparece en varias listas solo recibe una copia.'),

  h(Text, { style: styles.faqQ }, '¿Los stickers QR se pueden reimprimir si se dañan?'),
  h(Text, { style: styles.faqA }, 'Sí, desde la edición de la máquina con el botón Mostrar QR → Imprimir sticker. Como el QR está vinculado al serial de la máquina y no a su ubicación, la reimpresión genera exactamente el mismo código.'),

  h(Text, { style: styles.faqQ }, '¿Qué hago si se cae Supabase o Resend?'),
  h(Text, { style: styles.faqA }, 'El sistema seguirá recibiendo escaneos pero no podrá registrar solicitudes ni enviar correos. Revisar el status de ambos servicios y avisar al administrador del sistema.'),

  h(View, { style: { marginTop: 30, paddingTop: 16, borderTopWidth: 1, borderTopColor: GRAY_200, borderTopStyle: 'solid' } },
    h(Text, { style: { fontSize: 9, color: GRAY_500, textAlign: 'center' } }, 'Corporación Toncan Digital, C.A.  ·  Documento de uso interno  ·  Versión 1.0')
  ),

  Footer('Preguntas frecuentes')
)

const doc = h(Document, { title: 'Toncan Digital - Manual Sistema Soporte QR', author: 'Toncan Digital' },
  cover, tecnico, tecnico2, tecnico3, uso1, uso2, uso3, uso4, faq
)

await renderToFile(doc, OUT)
console.log('PDF generado:', OUT)
