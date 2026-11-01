# Estado del proyecto

Actualizado: 2026-10-31

## Resumen

**Momentos Especiales** es una aplicación web para guardar recuerdos con fecha, texto, fotos, ubicación y música. Está hecha con React, TypeScript y Vite. El objetivo es que funcione bien en teléfonos, permita cuentas para varias personas y se publique fuera de GitHub Pages.

## Lo que ya está implementado

- Calendario mensual, vista de recuerdos y línea de tiempo con búsqueda y filtros.
- Edición de recuerdos con fotos, ubicación, descripción, hitos y música.
- Tema claro/oscuro y navegación móvil.
- Cuentas locales por perfil y almacenamiento de recuerdos en IndexedDB, con respaldo en `localStorage`.
- Easter egg de Grace: escribir `grace` o hacer triple clic en la marca.
- Configuración PWA, manifiesto, icono SVG y ajustes iniciales para iOS.
- Configuración de compilación para Vercel y Netlify (`vercel.json` y `netlify.toml`).
- Esquema SQL inicial de Supabase (`supabase-schema.sql`).
- El workflow de GitHub Pages ya se quitó.

## Estado actual de Git y publicación

- Repositorio y remoto actuales: `alqv10/calendarioimportante`, rama `master`.
- La rama estaba sincronizada con `origin/master` al preparar este informe.
- Los cambios de limpieza y compatibilidad móvil/iOS estaban preparados en staging; esta entrega los agrupa con este informe para confirmarlos juntos.
- Vercel y Netlify tienen archivos de configuración, pero no hay una URL de producción ni un despliegue verificado en este estado.
- No se lanzó un despliegue: este checkout no está vinculado a un proyecto de Vercel y la configuración actual de Supabase no debe exponerse a usuarios reales.
- El README todavía menciona `mmsuarez-oss`, GitHub Pages y un workflow que ya no existe; hay que actualizarlo antes de usarlo como guía.
- No borrar el repositorio anterior de GitHub hasta comprobar que el nuevo remoto conserva el historial y todos los cambios que se quieren mantener.

## Pendiente antes de aceptar usuarios reales

### Prioridad crítica: autenticación y privacidad

El inicio de sesión actual **no es autenticación segura para un servicio público**. Los perfiles se guardan en el navegador; si se configura Supabase, el código también guarda y consulta contraseñas en la tabla `profiles`. El esquema actual contiene políticas RLS con `using (true)` y `with check (true)`, que permiten acceso amplio a los datos.

Antes de conectar una base de datos real:

1. Implementar autenticación de Supabase Auth; no guardar ni consultar contraseñas propias en `profiles`.
2. Asociar perfiles y recuerdos al identificador autenticado y reemplazar las políticas abiertas por políticas RLS que limiten cada operación al propietario correspondiente.
3. Revisar y probar el acceso de lectura, escritura, modificación y borrado con más de una cuenta.
4. No publicar credenciales secretas en el cliente. La clave pública `anon` no sustituye las políticas RLS.

**No usar el esquema y las políticas actuales con datos personales reales ni con cuentas de usuarios.**

### Publicación

- Elegir Vercel o Netlify, vincular el repositorio `alqv10/calendarioimportante` y verificar una compilación y URL de producción.
- Configurar Supabase y cualquier variable de entorno necesaria en el proveedor elegido, una vez que la autenticación y las políticas sean seguras.
- Actualizar el README con el repositorio y proveedor actuales, y quitar las instrucciones obsoletas de GitHub Pages.

### Compatibilidad con iPhone/iOS

- Probar en Safari de iPhone la instalación en pantalla de inicio, navegación, safe areas, reproducción de audio y carga de fotos.
- Confirmar que el icono se muestra correctamente en iOS; si el SVG no se acepta como icono de inicio, generar y enlazar un PNG compatible.
- Esto es una PWA; no se ha creado ni publicado una aplicación nativa en App Store.

### Datos y operación

- Definir almacenamiento remoto para fotos y audio; el esquema SQL por sí solo no configura almacenamiento de archivos.
- Decidir cómo migrar los recuerdos locales existentes a una cuenta autenticada y cómo hacer copias de seguridad.
- Confirmar el borrado o archivo del repositorio anterior solo después de verificar la migración al repositorio nuevo.

## Verificación conocida

En esta entrega, `bun run build` terminó correctamente con TypeScript y Vite. Vite avisó que el bundle JavaScript principal supera 500 kB. `bun run lint` terminó correctamente con seis advertencias React preexistentes. El proyecto no declara un script de pruebas automatizadas.
