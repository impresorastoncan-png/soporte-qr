# Manual técnico y guía de uso
## Toncan Digital · Sistema de Soporte QR

---

# Parte I — Manual Técnico

## 1. Visión general

El Sistema de Soporte QR es una aplicación web desarrollada para Corporación Toncan Digital que reemplaza el flujo anterior basado en Google Forms + Google Sheets + Apps Script. El objetivo es permitir que cualquier usuario de un cliente corporativo pueda reportar una falla en una impresora Canon iR-ADVance en menos de 30 segundos, y que esa solicitud llegue automáticamente a las personas correctas dentro de Toncan.

Flujo principal de una solicitud:

1. El usuario final escanea el sticker QR pegado en la impresora.
2. Se abre el formulario público en su navegador móvil, ya precargado con el serial, modelo, cliente y ubicación de esa máquina.
3. El usuario llena los datos (urgencia, tipo de problema, descripción, si necesita tóner) y opcionalmente adjunta hasta 3 fotos.
4. Al enviar, la solicitud se registra en la base de datos con un ticket_id único.
5. El sistema envía un correo automático a los destinatarios correspondientes: ATC del cliente, técnicos asignados a esa máquina, encargado del cliente (si aplica), almacén si necesita tóner, y gerencia técnica si la urgencia es crítica.
6. El personal de Toncan ve la solicitud en tiempo real en el panel administrativo y en el wallboard.

## 2. Stack técnico

- **Next.js 16.2.3** — framework React con App Router y Turbopack.
- **React 19** — versión con Server Components, Server Actions y `useActionState`.
- **Supabase** — PostgreSQL administrado con autenticación, storage y realtime incluidos.
- **Resend** + **React Email** — envío transaccional de correos con templates tipados.
- **Tailwind CSS v4** — estilos utilitarios.
- **TypeScript 5** — tipado estricto en todo el proyecto.
- **Zod** — validación runtime del payload de la API.
- **xlsx (SheetJS)** — parsing de Excel en el navegador para importación masiva.
- **react-qr-code** — render SVG de códigos QR.
- **@react-pdf/renderer** — generación de PDFs (stickers, manuales).

Vale la pena destacar que Next.js 16 trae cambios importantes respecto a versiones anteriores: el archivo `middleware.ts` fue renombrado a `proxy.ts` con función `proxy`, y tanto `params` como `searchParams` ahora son Promesas que hay que `await`. Estos cambios están ya aplicados en el proyecto.

## 3. Estructura del proyecto

La raíz del proyecto sigue convenciones Next.js App Router:

- `app/` — rutas de la aplicación, cada carpeta es una ruta.
  - `soporte/[serial]/` — formulario público al que llega el escaneo del QR.
  - `api/soporte/` — endpoint POST que recibe el formulario y crea la solicitud.
  - `admin/login/` — página de autenticación administrativa.
  - `admin/live/` — wallboard en vivo a pantalla completa.
  - `admin/(dashboard)/` — grupo de rutas que comparten el layout con sidebar.
- `lib/` — código compartido: clientes Supabase, envío de correo, validaciones y utilidades.
- `components/` — componentes React compartidos: primitivos de UI del panel admin y el template de correo.
- `proxy.ts` — middleware de Next.js 16 que protege las rutas `/admin/*` y redirige al login cuando no hay sesión activa.
- `supabase_schema.md` — documentación versionada de todas las migraciones SQL del proyecto.
- `docs/` — este manual y cualquier otra documentación.

## 4. Base de datos

El esquema PostgreSQL está compuesto por cinco tablas principales más una vista de conveniencia. Todas las tablas tienen Row Level Security activado con políticas específicas.

**clientes** — empresas corporativas que arriendan impresoras. Campos clave: nombre, RIF, direccion, atc_email (correo del ATC asignado a ese cliente), activo, y `es_almacen` que distingue los almacenes internos de Toncan (CTD QTA, CTD L4) de los clientes reales.

**tecnicos** — personal técnico de Toncan. Nombre, email y estado activo.

**maquinas** — la flota de impresoras. Cada máquina tiene un serial único (el número de fábrica Canon que se usa en el URL del QR), modelo, cliente asignado, ubicación dentro del cliente, correo del encargado (opcional), y estado activo.

**maquina_tecnicos** — tabla M:N que asigna uno o más técnicos a cada máquina. Se usa para incluirlos como destinatarios de los correos de solicitud.

**solicitudes** — el registro de cada reporte entrante. Contiene los datos del formulario (urgencia, tipo de problema, descripción, fotos), un snapshot del cliente_nombre y modelo/ubicación de la máquina en el momento del reporte (por si esos datos cambian después), el ticket_id generado, y el estado actual (pendiente, en_proceso, resuelto).

La vista `v_maquinas_detalle` hace el JOIN entre máquinas y clientes más un array_agg de los correos de técnicos asignados, para que el backend pueda construir la lista de destinatarios con una sola query.

## 5. Variables de entorno

Todas se configuran en `.env.local` en desarrollo y en el dashboard de Vercel en producción:

- `NEXT_PUBLIC_APP_URL` — base URL de la aplicación. Se usa para construir las URLs que codifican los códigos QR. En local: `http://localhost:3000`. En producción: la URL de Vercel o el dominio custom.
- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — clave pública para el cliente del navegador (respeta RLS).
- `SUPABASE_SERVICE_ROLE_KEY` — clave de servicio para operaciones backend que necesitan bypass de RLS. Nunca debe exponerse al cliente.
- `RESEND_API_KEY` — API key de Resend para envío de correos.
- `EMAIL_FROM` — remitente de los correos. En sandbox se usa `onboarding@resend.dev`; en producción debe ser un dominio verificado en Resend, típicamente `soporte@toncandigital.com`.
- `EMAIL_ATC`, `EMAIL_ALMACEN`, `EMAIL_GERENTE_TEC` — direcciones de respaldo para destinos corporativos cuando el campo correspondiente no esté definido en la base de datos.

## 6. Flujo de una solicitud (end to end)

Cuando un usuario escanea un QR, la URL `/soporte/[serial]` es manejada por un server component que busca la máquina en la base de datos, carga los datos del cliente y renderiza el formulario. Si la máquina no existe o está inactiva, muestra un mensaje de error.

Al enviar el formulario:

1. El cliente sube las fotos primero al bucket `solicitudes-fotos` de Supabase Storage.
2. Con los URLs de las fotos ya obtenidos, hace POST a `/api/soporte` con el resto del payload.
3. El endpoint valida con Zod, consulta la máquina (con su cliente y técnicos), construye la lista deduplicada de destinatarios, inserta la fila en la tabla `solicitudes` con un ticket_id generado, y llama a `sendSolicitudEmail` de `lib/email.ts`.
4. `sendSolicitudEmail` renderiza el template React Email con los datos de la solicitud y usa Resend para enviarlo. El envío está envuelto en try/catch para que un fallo en el correo no bloquee la creación de la solicitud.
5. El cliente recibe la respuesta con el ticket_id y redirige al usuario a la página de agradecimiento.

Simultáneamente, cualquier navegador que tenga `/admin/live` abierto recibirá el INSERT en tiempo real vía el canal Supabase Realtime y mostrará la nueva solicitud en el wallboard sin necesidad de recargar.

## 7. Autenticación y permisos

El panel administrativo usa Supabase Auth con email/password. El middleware `proxy.ts` verifica la sesión para cualquier ruta bajo `/admin/*` y redirige a `/admin/login` si no hay usuario. El layout del grupo `(dashboard)` hace una verificación adicional en el servidor para proteger las páginas internas.

Las Row Level Security policies de la base de datos garantizan que:
- El cliente anónimo (rol `anon`, usado por el formulario público) solo puede leer máquinas activas y crear solicitudes.
- El cliente autenticado (rol `authenticated`, usado por el panel admin) tiene acceso completo de lectura y escritura sobre todas las tablas.
- El service role (usado por el backend para operaciones privilegiadas) hace bypass total de RLS.

## 8. Realtime

El wallboard en `/admin/live` usa Supabase Realtime para recibir INSERT, UPDATE y DELETE de la tabla `solicitudes` vía websocket. Para que funcione, la tabla debe estar incluida en la publicación `supabase_realtime`, lo cual se hace con un ALTER PUBLICATION una sola vez (ver `supabase_schema.md` §13).

El componente `LiveBoard.tsx` se suscribe al canal `solicitudes-live` al montarse y aplica los cambios en el estado local. Mantiene solo las solicitudes no resueltas ordenadas por urgencia y fecha. Cuando una solicitud pasa a estado `resuelto`, se remueve automáticamente del wallboard.

## 9. Deployment en Vercel

El proyecto está listo para desplegarse en Vercel sin configuración adicional más allá de las variables de entorno. Los pasos:

1. Conectar el repositorio de GitHub a un proyecto nuevo en Vercel.
2. Copiar todas las variables de `.env.local` a Environment Variables en Vercel, excepto `NEXT_PUBLIC_APP_URL` que se agrega en un segundo paso.
3. Hacer el primer deploy. Vercel entrega una URL del tipo `soporte-qr-xxx.vercel.app`.
4. Agregar `NEXT_PUBLIC_APP_URL` con esa URL y hacer Redeploy para que se compile en el cliente y los QRs apunten a producción.

Para producción real hay dos cambios pendientes: verificar el dominio `toncandigital.com` en Resend para poder enviar correos a direcciones reales (en sandbox solo se envían al dueño de la cuenta Resend), y apuntar un subdominio custom como `soporte.toncandigital.com` al proyecto Vercel.

## 10. Mantenimiento y troubleshooting

**Nueva migración de base de datos**: agregarla como nueva sección numerada en `supabase_schema.md` y correrla en el SQL Editor de Supabase. Nunca editar migraciones ya aplicadas.

**El QR de una máquina antigua sigue funcionando aunque cambie de cliente**: correcto, es el comportamiento diseñado. El QR codifica solo el serial; el resto de datos (cliente, ubicación, destinatarios del correo) se leen dinámicamente de la base de datos al momento del escaneo.

**Reemplazar una máquina en un cliente**: no se reimprime el QR. Simplemente se edita la máquina en el panel admin y se cambia su cliente/ubicación. Ver la guía de uso Parte II, Situación 5.

**El wallboard no muestra nuevas solicitudes en vivo**: verificar que el SQL de la §13 de `supabase_schema.md` haya sido ejecutado y que el indicador del wallboard diga "En vivo" (punto verde). Si dice "Desconectado", refrescar la página.

**Los correos no llegan**: revisar los logs en el dashboard de Resend. En modo sandbox, solo llegan correos a la cuenta dueña del API key.

---

# Parte II — Guía de uso para almacén

Esta guía está pensada para la persona de almacén que será la principal usuaria del sistema en el día a día: la que crea clientes, registra nuevas máquinas, las mueve entre ubicaciones y gestiona los reemplazos.

## Situación 0: Acceso al sistema

Para entrar al panel administrativo, abrir en el navegador:

**https://soporte.toncandigital.com/admin/login** (reemplazar por la URL real una vez desplegado)

Ingresar el correo y contraseña proporcionados por el administrador. Una vez dentro, verás el menú lateral con todas las secciones del sistema.

Si olvidas la contraseña, contactar al administrador del sistema para restablecerla desde Supabase.

## Situación 1: Agregar una nueva máquina a un cliente

Usar este flujo cuando llega un equipo nuevo para un cliente específico y quieres registrarlo individualmente.

1. En el sidebar, hacer click en **Clientes**.
2. Buscar el cliente en la lista y entrar a su detalle.
3. En la sección Máquinas, hacer click en **Agregar máquina**.
4. Llenar el formulario:
   - **Serial**: el número de fábrica Canon (aparece en la etiqueta trasera del equipo). Debe ser único en todo el sistema.
   - **Modelo**: ej. iR-ADV 4535i, iR-ADV C5540.
   - **Cliente**: ya viene precargado.
   - **Ubicación**: el sitio dentro del cliente donde se instala (ej. "Piso 2 · Administración").
   - **Correo del encargado**: opcional. Si se llena, esa persona recibirá copia de los correos de solicitud de esa máquina.
   - **Técnicos asignados**: marcar uno o más técnicos de Toncan. Ellos recibirán las notificaciones.
   - **Máquina activa**: dejar marcado para que el QR funcione.
5. Guardar. La máquina ya puede recibir solicitudes.

## Situación 2: Importar varias máquinas desde Excel

Usar este flujo cuando llega un cliente nuevo con su flota completa o cuando se va a cargar masivamente un listado.

1. En Clientes, entrar al cliente destino.
2. Hacer click en **Importar Excel**.
3. Revisar el formato esperado que se muestra en la página. Las columnas reconocidas son:
   - `serial` (obligatorio)
   - `modelo` (obligatorio)
   - `ubicacion` (opcional)
   - `encargado_email` (opcional)
4. Seleccionar el archivo `.xlsx` o `.xls` desde tu computadora.
5. El sistema muestra un preview con cada fila del Excel marcada como "OK" o con un error de validación. Revisar.
6. Hacer click en **Importar N máquina(s)**. El resultado muestra cuántas se insertaron, cuántas se actualizaron (si ya existían en este cliente) y cuántas se omitieron (si el serial ya está en otro cliente real).

Notas importantes:
- Si un serial del Excel ya existe en un almacén (CTD QTA o CTD L4), la importación lo mueve automáticamente al cliente destino. Esto facilita reasignar equipos que estaban retornados.
- Si un serial ya existe en otro cliente real, la fila se omite para prevenir asignaciones duplicadas. En ese caso hay que retirarla primero del cliente actual y luego reimportarla.

## Situación 3: Imprimir el QR de una máquina individual

Usar cuando necesitas el sticker de una sola máquina, por ejemplo al reemplazar un sticker dañado o al registrar una máquina nueva.

1. Ir a **Máquinas** en el sidebar o al detalle del cliente.
2. Click en **Editar** en la fila de la máquina.
3. En la parte superior del formulario hacer click en **Mostrar QR**.
4. Se muestra el código QR con el serial, modelo, cliente y la URL codificada.
5. Hacer click en **Imprimir sticker**. Se abre una ventana nueva con el sticker formateado a 96mm × 55mm listo para imprimir.
6. Usar la función de impresión del navegador (Ctrl+P) y seleccionar la impresora de etiquetas o papel adhesivo.

## Situación 4: Reemplazar una máquina en un cliente

Este es uno de los flujos más importantes. Caso típico: se daña la impresora `XWH04309` del cliente "Empresa A", se la llevan al almacén de Toncan y en su lugar se instala la máquina `XLJ04170` que estaba guardada.

**Paso A — Retirar la máquina dañada al almacén:**

1. Ir a **Máquinas** → buscar `XWH04309` → **Editar**.
2. Hacer scroll hasta la sección **Zona de peligro**.
3. En **Retirar a almacén**, seleccionar el almacén destino (CTD QTA o CTD L4 según corresponda).
4. Click en **Retirar**. Confirmar.
5. La máquina queda marcada como inactiva, sin ubicación, y aparece ahora en la vista del almacén elegido. Su QR físico sigue siendo el mismo.

**Paso B — Asignar la máquina de repuesto al cliente:**

1. Ir al almacén donde está `XLJ04170` (sección **Almacenes** en el sidebar).
2. Entrar al almacén → buscar la máquina → **Editar**.
3. En el formulario cambiar:
   - **Cliente**: seleccionar "Empresa A".
   - **Ubicación**: el mismo sitio donde estaba la anterior, ej. "Piso 2 · Administración".
   - **Máquina activa**: marcar.
4. Guardar.

Resultado: el sticker QR que ya estaba pegado en `XLJ04170` sigue siendo el mismo (nunca se reimprime), y a partir de ahora cuando alguien lo escanee, las solicitudes irán al ATC de "Empresa A".

El punto clave de este diseño es que **los stickers QR viajan con la máquina, no con el cliente**. Cada máquina física tiene su propio QR de por vida; lo único que cambia en el sistema es la asignación máquina → cliente.

## Situación 5: Mover una máquina de un cliente a otro

Similar al reemplazo pero sin retirarla al almacén. Se usa cuando se reubica directamente.

1. Ir a **Máquinas** → **Editar** la máquina.
2. Cambiar el campo **Cliente** al nuevo destino.
3. Actualizar **Ubicación** y, si aplica, **Correo del encargado**.
4. Guardar.

El QR no cambia. Las próximas solicitudes escaneadas llegarán al nuevo cliente.

## Situación 6: Retirar una máquina cuando vuelve a depósito

Cuando un cliente termina el contrato o devuelve una máquina a Toncan y no va a ser reasignada de inmediato.

1. Ir a **Máquinas** → **Editar** la máquina.
2. Ir a **Zona de peligro** → **Retirar a almacén**.
3. Seleccionar CTD QTA o CTD L4 según donde quede físicamente.
4. Confirmar.

La máquina queda en el almacén, inactiva, y puede reasignarse después (Situación 4 Paso B) o importarse de nuevo vía Excel cuando se defina su próximo destino.

## Situación 7: Eliminar una máquina permanentemente

Solo usar cuando la máquina nunca va a volver (venta, baja definitiva) **y no tiene solicitudes históricas registradas**. Si tiene solicitudes, el sistema bloquea la eliminación para preservar el histórico, y habrá que usar "Retirar a almacén" en su lugar.

1. Opción rápida: en la tabla de máquinas de un cliente o en la lista general, click en **Eliminar** en la fila de la máquina. Confirmar.
2. Opción desde el formulario: entrar a **Editar** la máquina → **Zona de peligro** → **Eliminar máquina**. Confirmar.

Si el sistema muestra el error "No se puede eliminar: la máquina tiene solicitudes históricas", usar Retirar a almacén.

## Situación 8: Crear un cliente nuevo

1. En el sidebar, **Clientes** → **Nuevo cliente**.
2. Llenar los datos:
   - **Nombre** del cliente (ej. "Empresa A, C.A.")
   - **RIF** (opcional)
   - **Dirección** (opcional)
   - **ATC Email**: el correo del ATC de Toncan asignado a ese cliente. Es el destinatario principal de las solicitudes.
   - **Activo**: marcar.
3. Guardar.
4. Luego registrar sus máquinas con Situación 1 o Situación 2.

## Situación 9: Ver las solicitudes entrantes

1. En el sidebar, **Solicitudes**.
2. La tabla muestra las últimas solicitudes ordenadas por fecha descendente.
3. Usar los filtros de la parte superior para acotar:
   - **Cliente**: ver solo las de un cliente.
   - **Urgencia**: filtrar por nivel (crítica, alta, media, baja).
   - **Estado**: pendientes, en proceso o resueltas.
   - **Tóner**: las que requieren reposición de tóner.
   - **Desde / Hasta**: rango de fechas.
   - **Buscar**: búsqueda libre por ticket, serial o nombre del solicitante.
4. Click en cualquier fila abre el drawer de detalle con toda la información, descripción completa y fotos si las hay.

## Situación 10: Cambiar el estado de una solicitud

1. Abrir la solicitud en **Solicitudes** haciendo click en su fila.
2. En la parte inferior del drawer hay tres botones: **Pendiente**, **En proceso**, **Resuelto**.
3. Click en el nuevo estado. El cambio se refleja de inmediato y también en el wallboard en vivo.

Flujo típico: una solicitud nueva entra como Pendiente. Cuando el técnico sale a atenderla, se marca En proceso. Una vez resuelta, se marca Resuelto y desaparece del wallboard.

## Situación 11: Usar el wallboard en vivo

El wallboard en `/admin/live` está diseñado para mostrarse en una pantalla grande o TV del área técnica. Se actualiza en tiempo real sin necesidad de recargar.

1. Entrar con las mismas credenciales del panel admin.
2. En la barra superior del panel de Solicitudes, click en **Vista en vivo**. O ir directamente a `/admin/live`.
3. La pantalla muestra todas las solicitudes no resueltas (pendientes y en proceso) ordenadas por urgencia y fecha.
4. Las solicitudes críticas pulsan en rojo para llamar la atención.
5. El indicador "En vivo" en la esquina superior derecha debe estar verde pulsante. Si está rojo ("Desconectado"), refrescar la página.
6. El botón **Sonido ON/OFF** activa un pitido cada vez que entra una solicitud crítica nueva. Por restricciones del navegador, hay que activarlo manualmente una vez por sesión.
7. Para salir, usar el enlace **← Salir** arriba a la derecha o la tecla F11 si está en pantalla completa.

## Situación 12: Eliminar una solicitud

Solo se usa para limpiar solicitudes de prueba o registradas por error. Las solicitudes reales deben marcarse como "Resuelto" en lugar de eliminarse, para preservar el histórico.

1. Abrir la solicitud en el drawer de detalle.
2. En la parte inferior, click en el enlace rojo **Eliminar solicitud**.
3. Confirmar. La solicitud se borra permanentemente.

---

## Preguntas frecuentes

**¿Qué pasa si un usuario escanea el QR de una máquina que no existe en el sistema?**
El formulario muestra un mensaje de error "Equipo no encontrado" y no permite enviar la solicitud. Hay que registrar esa máquina primero.

**¿Puedo reasignar la misma máquina varias veces sin perder el histórico?**
Sí. Cada vez que se mueve una máquina entre clientes, las solicitudes antiguas conservan el snapshot del cliente que tenían en el momento de ser creadas (campo `cliente_nombre` en la solicitud), así que el histórico es consistente.

**¿Por qué el botón Eliminar a veces dice que no puede eliminar?**
Porque la máquina tiene solicitudes históricas asociadas. Esto es una protección para no perder registros. Usa "Retirar a almacén" en su lugar.

**¿Cuántas fotos pueden adjuntar los usuarios finales al reportar una falla?**
Hasta 3 fotos por solicitud, de máximo 5 MB cada una, en formatos JPG, PNG o WebP.

**¿Quién recibe los correos de una solicitud?**
Dependiendo de los datos configurados: el ATC del cliente, los técnicos asignados a esa máquina, el encargado del cliente (si se configuró en la máquina), y adicionalmente el almacén si la solicitud marca "necesita tóner" y la gerencia técnica si la urgencia es Crítica. Los correos se deduplican, así que si una persona aparece en varias listas solo recibe una copia.

**¿Los stickers QR se pueden reimprimir si se dañan?**
Sí, desde la edición de la máquina con el botón Mostrar QR → Imprimir sticker. Como el QR está vinculado al serial de la máquina y no a su ubicación, la reimpresión genera exactamente el mismo código.

**¿Qué hago si se cae Supabase o Resend?**
El sistema seguirá recibiendo escaneos pero no podrá registrar solicitudes ni enviar correos. Revisar el status de ambos servicios y avisar al administrador del sistema.
