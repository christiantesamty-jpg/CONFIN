# ConFin 5.3.7 — Corrección de apertura en Safari

Esta versión parte exactamente de **ConFin 5.3.6**. Solo cambia el sistema de carga/caché, el número de versión y las rutas a recursos inmutables copiados de la versión anterior. No altera el diseño móvil ni ninguna regla financiera.

## Qué pasó

Cloudflare Pages puede redirigir `https://confin.pages.dev/index.html` a `https://confin.pages.dev/`. El Service Worker de 5.3.6 guardaba la respuesta resultante y la devolvía en cualquier navegación. Safari/iOS rechaza algunas respuestas que contienen metadatos de redirección y presenta `Response served by service worker has redirections`.

## Corrección

- Cachear la URL canónica `/` en vez de `/index.html`.
- Crear una respuesta nueva (sin metadatos de redirección) antes de guardar/entregar cualquier página desde el Service Worker.
- Verificar tipo de contenido y la descarga completa de recursos antes de activar.
- Activar esta reparación automáticamente y limpiar las copias viejas de `confin-static-*` (solamente archivos estáticos, NUNCA los datos financieros).
- Conservar archivos 5.3.5/5.3.6 para la transición entre versiones.

## Cómo publicar

1. En cada iPhone, si la app abre, exportar un respaldo desde Configuración. NO desinstalar, NO borrar datos de Safari.
2. Abrir la carpeta del repositorio GitHub `CONFIN` en la rama `main` o una rama de prueba.
3. Subir **todo el contenido descomprimido** de este paquete a la raíz. Verifica `index.html`, `service-worker.js`, `version.json` y `assets/5.3.7/`.
4. Hacer commit y confirmar que Cloudflare Pages finalice con éxito.
5. Probar `https://confin.pages.dev/` en Safari. Después cerrar y volver a abrir ConFin instalada. Si aún ves la pantalla de error, con conexión pulsa reintentar/recargar y vuelve a abrirla. La activación de un Service Worker nuevo depende de las comprobaciones de iOS; no recomendamos borrar almacenamiento.
6. Si tras actualizar el servidor no se recupera la instalación anterior, hay que diagnosticar el registro activo con Web Inspector/servicio de actualización. **No elimines los datos para forzar la solución**.

No es necesario crear otro proyecto de Cloudflare ni cambiar de dominio. El código guarda la misma clave `confin-v4-data`.

## Limitación

Probado con simulaciones de Service Worker y pruebas de interfaz en Chromium. Sin prueba física de esta reparación en Safari del iPhone, ni consulta HTTP directa al despliegue de Cloudflare desde este entorno. No declarar recuperación física verificada hasta que se confirme en el dispositivo.
