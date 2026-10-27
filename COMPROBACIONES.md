# ConFin 5.3.4 — Pruebas y alcance

Fecha: 27 de octubre de 2026. Base: ConFin 5.3.3.

## Automatizadas ejecutadas correctamente

- `node --check` en `app.js` y `service-worker.js`; JSON de `version.json` y `manifest.webmanifest` válido.
- Smoke test de navegador Chromium: navegación, botones, formularios de ingreso, gasto y categorías, temas, cuentas, metas y presupuestos; sin excepciones JavaScript en esas pruebas.
- Cálculos con ingresos, gastos, transferencias y pago de crédito; totales y porcentaje mensual; presupuesto sin mezclar gastos fuera de categoría.
- Guardado/importación: confirmación previa a importar, rechazo de respaldos inválidos, punto de restauración, recuperación ante datos corruptos, importación de categorías sin reemplazar transacciones y preservación de emojis.
- Prohibición de eliminar cuentas con movimientos vinculados; borradores de Repetir no se guardan automáticamente.
- Listado de 2,500 movimientos (paginación de 40 en 40), búsqueda y filtrado por mes.
- Layout con viewport de 320×640, 360×780, 375×812, 390×844, 430×932 y 768×1024 en Chromium: barra al pie, contenido desplazable y sin desbordamiento horizontal en las vistas principales.
- Simulación CSS de `safe-area` superior e inferior y posicionamiento del botón + en pantallas pequeñas.
- Service Worker evaluado en un entorno de prueba Node: un error de red de un JS/CSS no devuelve el documento HTML como sustituto.

## Pruebas todavía necesarias en el iPhone real

1. Instalada como PWA desde Safari, abrir y cerrar la app y verificar la altura de la barra inferior y el área del indicador de inicio.
2. Abrir formularios con teclado virtual, desplazarse hasta Guardar y cerrar el teclado sin que se recorten botones.
3. Crear, editar y eliminar un ingreso/gasto; verificar cambio inmediato en Inicio y presupuesto.
4. Cambiar de tema, navegar por todas las pantallas y probar Face ID y el PIN de recuperación.
5. Exportar el respaldo completo; abrir Archivos para comprobar el JSON; importar un archivo de prueba y verificar los conteos.
6. Publicar la nueva versión en el mismo dominio y comprobar que el aviso de actualización aparece, el contenido se refresca y los datos siguen intactos.
7. Comprobar modo sin conexión tras una primera carga conectada.

**Alcance:** No hay pruebas de Safari/iOS real, integración con Cloudflare publicada, ni auditoría formal de seguridad. No asumir que una prueba simulada sustituye estas comprobaciones.
