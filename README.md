# Momentos Especiales ✨

Calendario para guardar recuerdos con fechas, fotos, lugares, notas y música. Aplicación web adaptable a móviles y preparada para instalarse como PWA.

## Funciones

- Calendario, línea de tiempo, búsqueda y vista de hitos.
- Recuerdos con fotos, ubicación, texto y música.
- Tema claro/oscuro y navegación móvil.
- Almacenamiento local heredado, ya no disponible como modo de acceso.
- Cuentas en la nube con correo y contraseña mediante Supabase Auth.
- Los datos sincronizados en Supabase están limitados por cuenta mediante Row Level Security (RLS).
- PWA para añadir a la pantalla de inicio en dispositivos compatibles. No es una aplicación nativa de App Store.
- Easter egg de Grace: escribe `grace` o haz triple clic en el logo.

## Desarrollo local

Requiere Bun y Node.js compatibles con las versiones declaradas en `package.json`.

```bash
bun install
bun run dev
```

Abre la URL local que muestra Vite. Para compilar y revisar el código:

```bash
bun run build
bun run lint
```

## Supabase

La producción usa un proyecto Supabase gratuito con credenciales compartidas desde Vercel. Antes existían perfiles y recuerdos locales en el navegador; esos perfiles **no son cuentas protegidas, no se sincronizan y no sirven para cambiar de dispositivo**.

La aplicación ahora exige una sesión cloud antes de mostrar recuerdos. Sin Supabase, solo aparece la pantalla de configuración: no permite entrar con perfiles locales, porque no pueden verificar una cuenta única ni proteger el acceso. Los recuerdos locales antiguos y los que no tengan propietario asignado se mantienen ocultos; no se atribuyen automáticamente a ninguna cuenta.

Para configurar otro despliegue:

1. Crea un proyecto Supabase nuevo.
2. Ejecuta `public/supabase-schema.sql` en el SQL Editor. El esquema configura Supabase Auth, crea el perfil al registrarse y limita los perfiles y recuerdos autenticados mediante RLS.
3. En Authentication, configura el envío y confirmación de correo, así como las URL permitidas para tu sitio.
4. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como variables del despliegue (o usa la configuración manual por navegador durante el desarrollo local).
5. Prueba registro, confirmación de correo, acceso, emparejamiento y aislamiento entre dos cuentas antes de guardar datos reales. El correo de Supabase y el nombre de usuario único identifican cada cuenta.

Con el esquema actualizado, cada cuenta puede crear un código de invitación de un solo uso, válido por 48 horas. La otra cuenta debe aceptarlo. De forma predeterminada cada persona solo puede consultar, editar y borrar sus propios recuerdos. Solo las dos cuentas emparejadas explícitamente pueden ver los recuerdos, fotos y audios de la otra; cada una conserva edición y borrado únicamente de los propios. Cualquiera puede desvincularlas y revocar el acceso. Ambas cuentas deben usar el mismo proyecto Supabase.

En producción, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y las URL de autenticación ya están configuradas para `https://calendarioimportante.vercel.app`. Para otros despliegues, configura esas variables en el entorno de compilación y añade su dominio a las URL permitidas de Supabase. Son la URL del proyecto y su clave pública; nunca uses la `service_role` key. También se admite configuración manual por navegador para desarrollo local.

**No ejecutes el esquema sobre la base de datos del prototipo anterior.** Esa versión guardaba contraseñas en `profiles` y usaba políticas públicas. El esquema nuevo detecta sus tablas incompatibles y aborta; no migra los datos antiguos. Respalda y migra cualquier dato existente por separado. Nunca pongas una `service_role` key en la aplicación.

Fotos y audio todavía se guardan en los datos del recuerdo; no se ha configurado Supabase Storage ni un flujo de migración de archivos.

## Móviles e instalación

La aplicación es una PWA adaptable, no una app nativa de App Store o Google Play. En iPhone, abre el sitio en Safari y usa **Compartir → Añadir a pantalla de inicio**. En Android, abre el sitio en Chrome y elige **Instalar aplicación** o **Añadir a pantalla de inicio**. Debe servirse por HTTPS; la sesión se conserva en cada dispositivo y requiere conexión a internet para acceder a las cuentas y sincronizar recuerdos.

## Despliegue

El sitio está publicado en [calendarioimportante.vercel.app](https://calendarioimportante.vercel.app). La versión de producción exige iniciar sesión o crear una cuenta y no muestra recuerdos sin sesión. El esquema seguro ya se aplicó al proyecto Supabase gratuito; Vercel tiene las variables de producción y Supabase usa el dominio publicado como URL de autenticación. Aún falta probar el registro, la confirmación por correo y el emparejamiento con dos cuentas reales antes de guardar recuerdos importantes.

El proyecto de Vercel todavía no está conectado a GitHub para despliegues automáticos; por ahora, los cambios se publican manualmente con `vercel deploy --prod`.

GitHub Pages ya no está configurado. No borres otro repositorio ni cambies de proveedor hasta verificar la publicación y la transferencia del historial.

## Documentación del estado

Consulta [`ESTADO_DEL_PROYECTO.md`](ESTADO_DEL_PROYECTO.md) para el estado actual, las limitaciones conocidas y el trabajo pendiente.
