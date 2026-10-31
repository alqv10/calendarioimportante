# Momentos Especiales ✨ (Calendario de Recuerdos)

Una aplicación web alegre, cálida y minimalista para guardar, revivir y conmemorar los momentos más importantes que ya pasaron: primera cita, aniversarios, viajes, momentos en casa y días especiales con fotos, música y lugares.

---

## ✨ Características Principales

* 📅 **Calendario Interactivo & Geométrico:**
  * Diseño moderno y limpio (no circular, con esquinas sutiles y elegantes).
  * Vista mensual con navegación rápida entre meses y años.
  * Días marcados con miniaturas de fotos, corazones `💖` y coronas de hitos `✨`.
  * Toca cualquier día con recuerdos para abrir su ficha o cualquier día vacío para registrar un nuevo instante.

* 🎵 **Música & Canciones en tus Recuerdos:**
  * Asocia la canción especial de ese día (título, artista y enlace a Spotify/YouTube).
  * Sube archivos de audio directo (`.mp3`, `.wav`, `.m4a`) o notas de voz grabadas.
  * Mini reproductor integrado con animación de ecualizador al reproducir.

* 📱 **Optimizado para Teléfonos Móviles (PWA):**
  * Barra de navegación inferior móvil (`BottomNav`) para fácil uso con el pulgar.
  * Compatible como **PWA**: puedes "Añadir a pantalla de inicio" en iPhone o Android y usarlo como una aplicación nativa a pantalla completa.

* 🌙 **Modo Oscuro Integrado:**
  * Alterna entre modo claro (tonos crema y durazno cálidos) y modo oscuro (tonos grafito profundo con acentos neón).

* 👤 **Sistema de Cuentas Multi-Usuario:**
  * Cada persona puede crear su cuenta con nombre, usuario, contraseña opcional y avatar emoji.
  * Cambia de perfil en el mismo equipo con 1 clic.
  * Almacenamiento privado e independiente por usuario en **IndexedDB**.

* 🌸 **Easter Egg Secreto:**
  * Escribe **`grace`** con tu teclado en cualquier momento para ver la dedicatoria secreta.
  * O haz triple clic rápido en el logo de la marca en la cabecera.

---

## 🚀 Publicación y Despliegue

### 1. Subir a GitHub
```bash
# Crear repositorio público en tu cuenta de GitHub y subir el código
gh repo create mmsuarez-oss/calendarioimportante --public --source=. --remote=origin --push
```

### 2. GitHub Pages (Gratis y Automático)
El proyecto incluye un workflow en `.github/workflows/deploy.yml`:
1. Ve a tu repositorio en GitHub: `https://github.com/mmsuarez-oss/calendarioimportante`
2. Ve a **Settings** > **Pages**.
3. En **Source**, selecciona **GitHub Actions**.
4. ¡Listo! Tu aplicación estará publicada automáticamente en `https://mmsuarez-oss.github.io/calendarioimportante/`.

### 3. Vercel (1 Clic)
1. Entra a [vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. Importa el repositorio `calendarioimportante`.
3. Dale a **Deploy** y obtendrás un enlace público `https://calendarioimportante.vercel.app`.

---

## 💻 Desarrollo Local

```bash
bun install
bun dev
# O con npm:
# npm install
# npm run dev
```

Abre `http://localhost:5173`.
