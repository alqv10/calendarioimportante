# Estado del proyecto

Actualizado: 2026-10-31

## Resumen

**Momentos Especiales** es una aplicación web para guardar recuerdos con fecha, texto, fotos, ubicación y música. Está hecha con React, TypeScript y Vite. El objetivo es que funcione bien en teléfonos, permita cuentas para varias personas y se publique fuera de GitHub Pages.

## Lo que ya está implementado

- Calendario mensual, vista de recuerdos y línea de tiempo con búsqueda y filtros.
- Edición de recuerdos con fotos, ubicación, descripción, hitos y música.
- Tema claro/oscuro y navegación móvil.
- Modales sobre el elemento nativo `<dialog>`: cierre con Escape, foco atrapado, fondo inerte y scroll de la página bloqueado mientras están abiertos.
- Calendario y tarjetas operables por teclado: las celdas del día son `<button>` con nombre accesible y `aria-current` en el día de hoy; el título de cada recuerdo es el control enfocable que abre el detalle.
- Los recuerdos viven solo en Supabase. La capa IndexedDB/`localStorage` se eliminó de `storage.ts`: era inalcanzable, porque la aplicación exige una sesión cloud y sin Supabase nunca hay usuario. Los datos locales antiguos siguen en el navegador de cada quien, pero ningún código los lee; si alguna vez hay que migrarlos, ese código está en el historial de git.
- Cuentas cloud basadas en Supabase Auth (correo/contraseña), creación de perfiles al registrarse y políticas RLS por propietario.
- La aplicación exige una sesión cloud antes de mostrar recuerdos; sin Supabase no permite entrar con perfiles locales.
- La carga local filtra estrictamente por propietario y no muestra recuerdos sin dueño asignado.
- Easter egg de Grace: escribir `grace` o hacer triple clic en la marca.
- Configuración PWA, manifiesto, favicon SVG y ajustes iniciales para iOS.
- Iconos PNG de instalación para iOS y Android, áreas seguras móviles y entrada de formulario optimizada para Safari.
- La configuración Supabase admite variables de entorno compartidas para que los usuarios no tengan que configurar cada teléfono por separado.
- Configuración de compilación para Vercel y Netlify (`vercel.json` y `netlify.toml`).
- Esquema SQL protegido para un proyecto Supabase nuevo (`public/supabase-schema.sql`); detecta y rechaza el esquema inseguro del prototipo.
- El workflow de GitHub Pages ya se quitó.

## Estado actual de Git y publicación

- Repositorio y remoto actuales: `alqv10/calendarioimportante`, rama `master`.
- La autenticación segura se publicó en `4b2b214`; los avatares ampliados y el emparejamiento de calendarios se publicaron en `13403d3`, ambos en `origin/master`.
- El bloqueo de acceso por sesión, la configuración móvil y los iconos PWA se publicaron en `7b1b71f` y están en `origin/master`.
- Producción: https://calendarioimportante.vercel.app. Se verificó que presenta iniciar sesión/crear cuenta y no muestra recuerdos cuando no hay sesión.
- El proyecto Supabase gratuito está Healthy y ya tiene aplicado `public/supabase-schema.sql`, con RLS y emparejamiento de calendarios.
- Las variables públicas `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están configuradas en Vercel Production. Supabase tiene el dominio de producción como Site URL y como URL permitida de redirección.
- El proyecto Vercel no está conectado a GitHub para despliegues automáticos; el despliegue actual se hizo manualmente con la CLI.
- No se ha creado ni probado una cuenta de usuario real; la confirmación por correo y los flujos entre dos cuentas todavía necesitan pruebas.
- El README describe el repositorio y las instrucciones actuales; GitHub Pages ya no está configurado.
- No borrar el repositorio anterior de GitHub hasta comprobar que el nuevo remoto conserva el historial y todos los cambios que se quieren mantener.

## Pendiente antes de aceptar usuarios reales

### Prioridad crítica: autenticación y privacidad

El código utiliza Supabase Auth, RLS por propietario y emparejamiento mutuo de calendarios con invitación aceptada y acceso de solo lectura. El inicio exige una sesión y borra la vista anterior al cambiar de cuenta. El esquema seguro ya se ejecutó en el proyecto nuevo; falta probar el comportamiento completo con cuentas reales.

Antes de aceptar usuarios reales:

1. Verificar registro, confirmación por correo, inicio/cierre de sesión y aislamiento CRUD de recuerdos entre dos cuentas.
2. Probar invitación, lectura mutua, bloqueo de cambios sobre recuerdos ajenos y revocación del emparejamiento.
3. No publicar credenciales secretas en el cliente. La clave pública de Supabase no sustituye las políticas RLS.

**No conectar el prototipo Supabase anterior ni usar el esquema antiguo con datos personales reales.** No hay migración automática de esos perfiles/recuerdos.

El emparejamiento comparte todos los recuerdos existentes y futuros, incluidas fotos y audios. Cada persona solo puede modificar o borrar los recuerdos de su propia cuenta; cualquiera puede revocar el vínculo. También falta probar con dos cuentas reales la invitación, la lectura mutua, el bloqueo de ediciones ajenas y la revocación.

Los perfiles locales y recuerdos sin propietario se mantienen ocultos; no se migran ni se asignan automáticamente para evitar exponer información de otra persona. Los nombres de usuario locales no son globalmente únicos ni se usan para iniciar sesión. La autenticación única requiere Supabase Auth.

### Publicación

- Opcional: conectar GitHub a Vercel para habilitar despliegues automáticos; por ahora se usa `vercel deploy --prod`.
- La instancia y las variables de producción ya están configuradas para `https://calendarioimportante.vercel.app`.

### Compatibilidad con iPhone/iOS

- Probar en Safari de iPhone y Chrome de Android la instalación en pantalla de inicio, navegación, safe areas, reproducción de audio y carga de fotos.
- Esto es una PWA; no se ha creado ni publicado una aplicación nativa en App Store.

### Datos y operación

- Fotos y audio se guardan en Supabase Storage (bucket privado `memorias`, `public/supabase-storage.sql`), no dentro de la fila del recuerdo. Falta ejecutar ese SQL en el proyecto de producción y probarlo con una cuenta real: sin el bucket, subir una foto falla.
- Decidir cómo migrar los recuerdos locales existentes a una cuenta autenticada y cómo hacer copias de seguridad.
- Confirmar el borrado o archivo del repositorio anterior solo después de verificar la migración al repositorio nuevo.

## Verificación conocida

La implementación local de autenticación obligatoria pasó `bun run build`, `bun run lint` y `git diff --check`. Las políticas SQL todavía requieren pruebas contra una instancia real con dos cuentas.

Lint reporta tres advertencias `set-state-in-effect` que quedan a propósito: son sincronizaciones de props a estado en `App`, `CloudConfigModal` y `MemoryFormModal`, y reescribirlas es riesgo sin beneficio visible.

El bundle se reparte en `vendor` (React + Supabase, ~433 kB / 123 kB gzip, cambia casi nunca) y el código de la aplicación (~130 kB / 31 kB gzip). `canvas-confetti` se carga bajo demanda. El grueso restante es React y Supabase; no hay recorte importante sin cambiar de dependencias.

`bun test` cubre los ayudantes de fecha (`src/utils/dateUtils.test.ts`). El comportamiento de los modales (Escape, clic fuera, bloqueo de scroll, login no descartable) se verificó a mano en navegador durante la revisión de diseño; no quedó automatizado porque el proyecto no tiene runner de navegador.
