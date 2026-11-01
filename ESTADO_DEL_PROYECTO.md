# Estado del proyecto

Actualizado: 2026-10-31

## Resumen

**Momentos Especiales** es una aplicación web para guardar recuerdos con fecha, texto, fotos, ubicación y música. Está hecha con React, TypeScript y Vite. El objetivo es que funcione bien en teléfonos, permita cuentas para varias personas y se publique fuera de GitHub Pages.

## Lo que ya está implementado

- Calendario mensual, vista de recuerdos y línea de tiempo con búsqueda y filtros.
- Edición de recuerdos con fotos, ubicación, descripción, hitos y música.
- Tema claro/oscuro y navegación móvil.
- Perfiles locales por navegador y almacenamiento de recuerdos en IndexedDB, con respaldo en `localStorage`.
- Cuentas cloud basadas en Supabase Auth (correo/contraseña), creación de perfiles al registrarse y políticas RLS por propietario.
- Easter egg de Grace: escribir `grace` o hacer triple clic en la marca.
- Configuración PWA, manifiesto, icono SVG y ajustes iniciales para iOS.
- Configuración de compilación para Vercel y Netlify (`vercel.json` y `netlify.toml`).
- Esquema SQL protegido para un proyecto Supabase nuevo (`public/supabase-schema.sql`); detecta y rechaza el esquema inseguro del prototipo.
- El workflow de GitHub Pages ya se quitó.

## Estado actual de Git y publicación

- Repositorio y remoto actuales: `alqv10/calendarioimportante`, rama `master`.
- La autenticación segura se publicó en `53c73fd`; los avatares ampliados y el emparejamiento de calendarios se publicaron en `7d96a04`, ambos en `origin/master`.
- Producción: https://calendarioimportante.vercel.app. Se comprobó que el sitio y `supabase-schema.sql` responden sin inicio de sesión.
- El proyecto Vercel existe, pero no quedó conectado a GitHub: Vercel requiere configurar una conexión de inicio de sesión de GitHub. Los cambios futuros no se desplegarán automáticamente hasta completar esa conexión.
- No se ha configurado ni probado un proyecto Supabase; las cuentas cloud no están activas. La URL y la clave pública se guardan por navegador y cada persona debe configurarlas manualmente por ahora.
- El README describe el repositorio y las instrucciones actuales; GitHub Pages ya no está configurado.
- No borrar el repositorio anterior de GitHub hasta comprobar que el nuevo remoto conserva el historial y todos los cambios que se quieren mantener.

## Pendiente antes de aceptar usuarios reales

### Prioridad crítica: autenticación y privacidad

El código utiliza Supabase Auth, RLS por propietario y emparejamiento mutuo de calendarios con invitación aceptada y acceso de solo lectura. El esquema seguro **no se ha ejecutado ni verificado contra una instancia real**.

Antes de aceptar usuarios reales:

1. Crear un proyecto Supabase nuevo y ejecutar `public/supabase-schema.sql`.
2. Verificar registro, confirmación por correo, inicio/cierre de sesión y aislamiento CRUD de recuerdos entre dos cuentas.
3. Configurar y probar URL permitidas/callbacks de autenticación en Supabase.
4. No publicar credenciales secretas en el cliente. La clave pública `anon` no sustituye las políticas RLS.

**No conectar el prototipo Supabase anterior ni usar el esquema antiguo con datos personales reales.** No hay migración automática de esos perfiles/recuerdos.

El emparejamiento comparte todos los recuerdos existentes y futuros, incluidas fotos y audios. Cada persona solo puede modificar o borrar los recuerdos de su propia cuenta; cualquiera puede revocar el vínculo. También falta probar con dos cuentas reales la invitación, la lectura mutua, el bloqueo de ediciones ajenas y la revocación.

### Publicación

- Conectar GitHub a Vercel para habilitar despliegues automáticos, o seguir desplegando manualmente.
- Configurar Supabase y las URL de autenticación para `https://calendarioimportante.vercel.app`.

### Compatibilidad con iPhone/iOS

- Probar en Safari de iPhone la instalación en pantalla de inicio, navegación, safe areas, reproducción de audio y carga de fotos.
- Confirmar que el icono se muestra correctamente en iOS; si el SVG no se acepta como icono de inicio, generar y enlazar un PNG compatible.
- Esto es una PWA; no se ha creado ni publicado una aplicación nativa en App Store.

### Datos y operación

- Definir almacenamiento remoto para fotos y audio; el esquema SQL por sí solo no configura almacenamiento de archivos.
- Decidir cómo migrar los recuerdos locales existentes a una cuenta autenticada y cómo hacer copias de seguridad.
- Confirmar el borrado o archivo del repositorio anterior solo después de verificar la migración al repositorio nuevo.

## Verificación conocida

La limpieza/iOS del commit `8156cda` pasó `bun run build`; en ese momento lint reportó seis advertencias React. La implementación actual de Supabase Auth/RLS aún requiere validación posterior. El bundle principal supera 500 kB. El proyecto no declara un script de pruebas automatizadas.
