# ConFin 5.3.7 - Evidencia y pendientes

## Revisión del problema

- En el código 5.3.6, `service-worker.js` precacheaba `./index.html` y servía esa respuesta a cualquier navegación. Cloudflare Pages documenta redirecciones automáticas de URLs de archivos HTML a rutas canónicas. Safari/WebKit puede rechazar `event.respondWith` si la respuesta conservó `redirected: true`.
- La nueva versión cachea `./` (ruta canónica) y reconstruye respuestas antes de almacenarlas/servirlas; descarta metadatos de redirección y encabezados propios de la compresión de transporte.
- Se activa el nuevo SW de manera inmediata para intentar recuperar instalaciones que no cargan; solo se eliminan caches `confin-static-*`, no `localStorage` ni `IndexedDB`.

## Pruebas ejecutadas

1. JavaScript de worker, app y core: `node --check`: OK.
2. Simulación de instalación con `fetch` sin redirecciones: nueva caché `confin-static-5.3.7`, respuesta de navegación `redirected=false`: OK.
3. Simulación de instalación con redirección de la raíz: respuesta reconstruida `redirected=false`: OK.
4. Verificación: el trabajador ya no solicita `/index.html`, elimina la antigua cache de ConFin y conserva una caché no relacionada: OK.
5. Chromium 430x932 usando HTML/CSS/JS finales y almacenamiento sintético en memoria: navegación principal, formulario de ingreso, guardar ingreso, Configuración, versión 5.3.7, sin errores de JavaScript: OK.
6. El archivo `app.js` nuevo únicamente modifica los tres identificadores de versión (5.3.6 -> 5.3.7); el CSS es idéntico y no modifica diseño.

## Pruebas pendientes

- Cloudflare real: no fue posible realizar solicitud HTTP directa desde el entorno.
- Safari físico PWA previamente bloqueada: requiere publicación de esta revisión y validación en el iPhone.
- Reproducción real de un servidor con redirecciones usando WebKit instalado: no disponible en este entorno.

**No borres Safari ni desinstales la PWA para arreglar este error sin respaldo.**
