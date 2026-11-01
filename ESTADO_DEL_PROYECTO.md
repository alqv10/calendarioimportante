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
- La rama `master` está sincronizada con `origin/master`.
- Vercel y Netlify tienen archivos de configuración, pero no hay una URL de producción ni un despliegue verificado en este estado.
- No se lanzó un despliegue: este checkout no está vinculado a un proyecto de Vercel y no se ha probado un proyecto Supabase nuevo.
- El README describe el repositorio y las instrucciones actuales; GitHub Pages ya no está configurado.
- No borrar el repositorio anterior de GitHub hasta comprobar que el nuevo remoto conserva el historial y todos los cambios que se quieren mantener.

## Pendiente antes de aceptar usuarios reales

### Prioridad crítica: autenticación y privacidad

El código ahora utiliza Supabase Auth para cuentas en la nube y RLS para restringir tablas por usuario. El esquema seguro **no se ha ejecutado ni verificado contra una instancia real**.

Antes de aceptar usuarios reales:

1. Crear un proyecto Supabase nuevo y ejecutar `public/supabase-schema.sql`.
2. Verificar registro, confirmación por correo, inicio/cierre de sesión y aislamiento CRUD de recuerdos entre dos cuentas.
3. Configurar y probar URL permitidas/callbacks de autenticación en Supabase.
4. No publicar credenciales secretas en el cliente. La clave pública `anon` no sustituye las políticas RLS.

**No conectar el prototipo Supabase anterior ni usar el esquema antiguo con datos personales reales.** No hay migración automática de esos perfiles/recuerdos.

### Publicación

- Elegir Vercel o Netlify, vincular el repositorio `alqv10/calendarioimportante` y verificar una compilación y URL de producción.
- Configurar Supabase y las URL de autenticación para el dominio final.

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
