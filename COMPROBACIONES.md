# Verificación de ConFin 5.3.8 · RC1

## Base y alcance

- Código base: `ConFin_5.3.7_CORRECCION_SAFARI_SERVICE_WORKER.zip` (proporcionado en la conversación).
- Esta actualización reemplaza los recursos de app por una sola carpeta versionada `assets/5.3.8/`.
- El Service Worker **conserva** el manejo de URL canónica `/` y la reconstrucción de respuestas sin metadatos de redirección que corrigió Safari 5.3.7. Solo se actualizaron identificador y rutas de recursos.
- No hay nuevas dependencias de JavaScript, APIs pagadas ni servicios en la nube.

## Ejecuciones reales

- `node --check` sobre `app.js`, `core.js` y `service-worker.js`: correcto.
- Playwright + Chromium con interacción real en los controles HTML ejecutados desde contenido local insertado, con `localStorage` simulado: **12 grupos aprobados, 0 fallidos**.
- Verificados: todas las 11 paletas y persistencia de selección; navegación a categorías en Configuración; alta de categorías de ambos tipos; edición de nombre, emoji compuesto y color; migración de schema 9 a schema 10 y copia previa.
- Verificados: inversión con aportación de $20,000, valor actualizado a $21,000, retiro de $3,000, rendimiento cobrado de $500; cálculo de saldo bancario, valor de inversión, resultado y patrimonio, y rendimiento visible de lectura en Movimientos.
- Verificados: préstamo inicial de $10,000, abonos de $3,000 y $7,000, interés cobrado de $250, estado liquidado, ocultamiento de resumen pendiente y acceso al historial.
- Verificados: crear y editar movimiento previo, navegar por Presupuestos y Metas, respaldo con los campos nuevos, anular sin duplicados un préstamo sin abonos y una inversión con un único aporte, saldo insuficiente rechazado y recarga de datos.
- Revisados visualmente anchos **320, 360, 390, 430 y 768 px** en Configuración, Categorías, Cuentas e Inversiones; sin desbordamiento horizontal en esos casos. Se inspeccionó además una inversión de nombre largo con $123,456.78 en pantalla de 320 px.
- Simulación del Service Worker con respuesta canónica normal y con redirección: **2 escenarios aprobados**, en ambos se devuelve una respuesta de navegación con `redirected=false` y se eliminan exclusivamente cachés estáticas anteriores de ConFin.

## No comprobado

- Safari iOS / modo standalone en iPhone 15 Pro Max: **requiere validación física** de desplazamiento, teclado y zona segura.
- Prompts de Face ID y PIN en hardware real: **sin prueba física**.
- Prueba de despliegue HTTPS real de Cloudflare Pages e instalación sobre una sesión con datos personales: **no ejecutada**.
- Cuota real de almacenamiento, actualización de caches en PWA instalada y flujos offline: **sin prueba física o E2E real**.
- No se ha validado contablemente TIR o rentabilidad anualizada; el módulo usa rendimiento total simple, con valor de inversión introducido manualmente.

## Prueba manual recomendada en iPhone

Instala **primero una vista previa con datos ficticios**. Comprueba que la barra inferior no deje espacio sobrante, que toda la pantalla pueda desplazarse, y que los formularios sean utilizables con teclado abierto. Comprueba cambiar tema y regresar a Configuración; crear gastos, ingresos y categorías; agregar inversión, modificar valor y recibir rendimiento; registrar préstamo y dos abonos; exportar/importar un respaldo ficticio; cerrar y volver a abrir la PWA; verificar que los datos persistan. Solo entonces considerar publicar en producción.
