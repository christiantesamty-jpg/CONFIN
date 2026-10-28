# Auditoria de alcance y cambios - ConFin 5.3.9 RC1

| Problema | Modulo modificado | Solucion | Evidencia | Riesgo restante |
|---|---|---|---|---|
| Catalogo incompleto | app.js: catalogo y normalizacion | 28 categorias de gastos, 9 ingresos; migracion aditiva sin eliminar personalizaciones | 21 aserciones y 17 verificaciones de compatibilidad aprobadas | Validar el respaldo personal |
| Categorias desordenadas | Configuracion, categoria/presupuesto/registro | Orden editable, restauracion y favoritos con IDs | Interaccion en navegador y recarga correctas | Prueba tactil de iPhone |
| Tarjetas de categorias enormes | app.js y styles.css | Editar/Archivar/Borrar en fila compacta, adaptable a 320px | Screenshot y comprobacion de dimensiones | Accesibilidad VoiceOver no probada |
| Mes del presupuesto fuera del modal | Hoja de presupuesto y CSS | Mes y ano en dos selectores adaptables, con valor YYYY-MM | Guardado y medidas de 320 y 430 px correctos | Safari real con teclado |
| Registro de gastos lento | Hoja de Movimientos | Descripcion primero; busqueda, favoritos, ultima cuenta y borrador | Registro, guardado, recarga y totales correctos | Confirmar operacion tactil |
| Necesidad de foto de recibo | receipt-ocr.js, hoja de gastos, _headers | Camara/galeria; OCR local opcional; importe propuesto solo con confirmacion | Parser y OCR simulado aprobados | Descarga y reconocimiento reales pendientes |
| Riesgo de cache Safari | service-worker.js, rutas versionadas | Raiz canonica y respuestas sin metadata de redireccion | Test simulado SW correcto | Prueba OTA real en iPhone |
| Riesgo de regresiones | Modulos financieros | No se cambio modelo de transacciones ni inversiones/cobros | Pruebas basicas y migracion aprobadas | E2E con datos reales no ejecutada |

## Reglas de integridad

- Persistencia sin cambio de clave: `confin-v4-data` y esquema 10.
- No alterar movimientos historicos, presupuestos, metas, saldos ni significado de categorias existentes.
- En una instalacion existente, los IDs/nombres previamente presentes prevalecen sobre el nuevo JSON: la actualizacion agrega lo que falte pero NO renombra una categoria que ya haya sido usada.
- Aportaciones, prestamos, pagos de tarjeta e ingresos no fueron refactorizados en esta version.
- Orden de categorias, favoritos y ultima cuenta seleccionada solo influyen en la interfaz, no en los saldos financieros.
- Fotos no se almacenan ni exportan. No afirmar que estan respaldadas; la lectura OCR puede fallar.

## Desglose de archivos

- `assets/5.3.9/app.js`: catalogos, migracion, formularios, configuracion y budget sheet.
- `assets/5.3.9/styles.css`: estilos solo para los nuevos controles, conservando los estilos base.
- `assets/5.3.9/receipt-ocr.js`: OCR local opcional; para compatibilidad necesita descargar dependencias la primera vez.
- `assets/5.3.9/core.js`, `boot.js`: recursos base empaquetados en carpeta versionada.
- `index.html`, `version.json`: apuntan a la version candidata 5.3.9.
- `service-worker.js`: actualiza cache versionada con la correccion Safari mantenida.
- `_headers`: amplia politica de carga de la libreria OCR. No se agregan APIs pagadas.
- `README.md`, `COMPROBACIONES.md`, este informe y checksums: instrucciones y evidencia.

## Evaluacion y prioridades

- Riesgo bajo a moderado: selector mes/ano, orden, formularios y categorias, siempre que no se publique sin probar una migracion de copia.
- Riesgo moderado: adaptacion iPhone, por las diferencias entre Chromium y Safari PWA instalada.
- Riesgo mas alto: OCR externo experimental sin validacion real; captura manual sigue siendo principal.

Se recomienda, en versiones posteriores y separadas, estudiar: plantillas/repeticion de gastos, gastos recurrentes con confirmacion, dividir compras sin duplicar cargos, comprobantes almacenados y exportados con IndexedDB, y respaldo automatico externo. No se implementaron en esta candidata para reducir regresiones.
