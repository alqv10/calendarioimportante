# Momentos Especiales ✨ (Calendario de Recuerdos)

Una aplicación web alegre, cálida y minimalista para guardar, revivir y conmemorar los momentos más importantes que ya pasaron: primera cita, aniversarios, viajes, momentos en casa y días especiales.

![Recuerdos y Calendario](https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1000&q=80)

---

## ✨ Características Principales

* 📅 **Calendario Interactivo:**
  * Vista mensual con navegación rápida entre meses y años.
  * Días marcados con miniaturas de fotos, corazones, emojis y coronas de hitos.
  * Toca cualquier día con recuerdos para abrir su ficha o cualquier día vacío para registrar un nuevo instante.
  * Resumen inferior con los recuerdos del mes en curso.

* 📖 **Álbum / Línea de Tiempo (Timeline):**
  * Vista estilo polaroid / scrapbook con fotos, lugares, contador de tiempo ("Hace 1 año y 3 meses").
  * Búsqueda en tiempo real por texto, ubicación o notas.
  * Filtros por categoría (Citas, Aniversarios, Viajes, Conciertos, etc.).
  * Orden cronológico ascendente o descendente.

* 🌟 **Hitos & Días Juntos:**
  * Contador en vivo de los días transcurridos desde su primer momento importante.
  * Línea de hitos destacados (primera cita, primer aniversario, propuestas, etc.).
  * Botón interactivo de explosión de confeti y fuegos artificiales 🎉.

* 📸 **Fotos, Ubicaciones y Notas:**
  * Subida de múltiples fotos por recuerdo con visor tipo carrusel.
  * Etiqueta de ubicación con enlace directo a Google Maps.
  * Registro de cómo se sintieron ese día (Amor, Mágico, Feliz, Divertido, etc.).
  * Pequeña historia o texto explicativo de lo que sucedió ese día.

* 💾 **100% Privado & Seguro (IndexedDB):**
  * Almacenamiento local directo en el navegador utilizando **IndexedDB** (soporta fotos de alta calidad sin límite restrictivo de localStorage).
  * Función de **Exportar Copia de Seguridad** (descarga un archivo `.json` con todos los recuerdos y fotos).
  * Función de **Importar** para restaurar recuerdos en cualquier navegador o dispositivo.

---

## 🚀 Cómo ejecutar la aplicación

### Requisitos
* [Bun](https://bun.sh) o [Node.js](https://nodejs.org) (v18+)

### Iniciar servidor de desarrollo
```bash
bun dev
# o con npm:
npm run dev
```

Abre tu navegador en `http://localhost:5173`.

### Compilar para producción
```bash
bun run build
# o con npm:
npm run build
```

---

Hecho con 💖 para nunca olvidar lo que nos hace sonreír.
