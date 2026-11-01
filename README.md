# Momentos Especiales ✨

Calendario para guardar recuerdos con fechas, fotos, lugares, notas y música. Aplicación web adaptable a móviles y preparada para instalarse como PWA.

## Funciones

- Calendario, línea de tiempo, búsqueda y vista de hitos.
- Recuerdos con fotos, ubicación, texto y música.
- Tema claro/oscuro y navegación móvil.
- Perfiles locales para uso en un solo navegador.
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

El proyecto no incluye credenciales compartidas ni un backend ya desplegado. Sin configurar Supabase, los perfiles y recuerdos se guardan en el navegador; esos perfiles **no son cuentas protegidas, no se sincronizan y no sirven para cambiar de dispositivo**.

Para habilitar cuentas compartidas:

1. Crea un proyecto Supabase nuevo.
2. Ejecuta `public/supabase-schema.sql` en el SQL Editor. El esquema configura Supabase Auth, crea el perfil al registrarse y limita los perfiles y recuerdos autenticados mediante RLS.
3. En Authentication, configura el envío y confirmación de correo, así como las URL permitidas para tu sitio.
4. En la aplicación, abre la configuración de nube e introduce la URL del proyecto y su clave pública `anon`/publishable.
5. Prueba registro, confirmación de correo, acceso, emparejamiento y aislamiento entre dos cuentas antes de guardar datos reales.

Con el esquema actualizado, cada cuenta puede crear un código de invitación de un solo uso, válido por 48 horas. La otra cuenta debe aceptarlo. Al emparejarse, ambas pueden consultar todos los recuerdos, fotos y audios, pero solo editar o borrar los propios. Cualquiera puede desvincularlas y revocar el acceso. Ambas cuentas deben usar el mismo proyecto Supabase.

La configuración de Supabase se guarda en el navegador. Hasta publicar la URL y la clave pública como configuración compartida del sitio, cada persona tendrá que introducirlas en su propio navegador; sin ello solo funciona el modo local.

**No ejecutes el esquema sobre la base de datos del prototipo anterior.** Esa versión guardaba contraseñas en `profiles` y usaba políticas públicas. El esquema nuevo detecta sus tablas incompatibles y aborta; no migra los datos antiguos. Respalda y migra cualquier dato existente por separado. Nunca pongas una `service_role` key en la aplicación.

Fotos y audio todavía se guardan en los datos del recuerdo; no se ha configurado Supabase Storage ni un flujo de migración de archivos.

## Despliegue

El sitio está publicado en [calendarioimportante.vercel.app](https://calendarioimportante.vercel.app); también se comprobó que la página y `supabase-schema.sql` son accesibles. Aún no se ha conectado un proyecto Supabase, así que las cuentas compartidas no están habilitadas.

El proyecto de Vercel todavía no está conectado a GitHub para despliegues automáticos. La conexión falló porque la cuenta de Vercel necesita una conexión de inicio de sesión de GitHub; se puede completar desde Vercel o desplegar manualmente con `vercel deploy --prod`. Configura las URL de autenticación de Supabase con el dominio final.

GitHub Pages ya no está configurado. No borres otro repositorio ni cambies de proveedor hasta verificar la publicación y la transferencia del historial.

## Documentación del estado

Consulta [`ESTADO_DEL_PROYECTO.md`](ESTADO_DEL_PROYECTO.md) para el estado actual, las limitaciones conocidas y el trabajo pendiente.
