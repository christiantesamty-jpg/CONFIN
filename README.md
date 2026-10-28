# ConFin 5.3.9 - Registro rapido, categorias y recibos (RC1)

Version candidata creada a partir de ConFin 5.3.8. No se ha publicado en Cloudflare. Conserva su layout para iPhone, navegacion, inversiones, cuentas por cobrar y el Service Worker Safari-safe.

## Funciones agregadas

- Catalogo inicial de 28 categorias de gastos y 9 de ingresos, con IDs, nombres, emojis y colores tomados del JSON proporcionado. El orden del archivo es el orden inicial en instalaciones nuevas.
- Migracion no destructiva: los usuarios anteriores conservan nombres, IDs, movimientos, categorias archivadas, colores y emojis personalizados. Se agregan las categorias nuevas faltantes por ID y no se recalculan movimientos historicos.
- En Configuracion > Categorias: orden manual con botones Subir y Bajar, restaurar orden predeterminado, favoritos, busqueda y botones Editar/Archivar/Borrar en horizontal cuando hay espacio.
- Presupuesto de mes especifico: selectores separados de mes y ano para no desbordarse del modal del iPhone.
- Registro de gastos e ingresos: descripcion opcional PRIMERO, importe, categoria, cuenta y fecha; categorias con busqueda/favoritos, cuenta recordada y borradores recuperables.
- Recibos opcionales: Tomar foto o Elegir foto. El reconocimiento de texto intenta proponer el TOTAL. El usuario tiene que pulsar Usar este monto y despues Guardar gasto. La foto NO se almacena ni se incluye en respaldo: se usa temporalmente para sugerir la cantidad. Siempre hay captura manual.
- OCR: primero intenta reconocimiento nativo si esta disponible; de lo contrario, la primera vez necesita conexion para descargar Tesseract.js 7 y sus datos de idioma. NO envia intencionalmente las imagenes a un servidor OCR, pero descarga codigo de un CDN. Se debe comprobar con un recibo real en Safari instalado.

## Publicacion segura en GitHub y Cloudflare Pages

1. Exportar un respaldo externo desde cada iPhone. No subir respaldos a GitHub.
2. Crear una rama `confin-539-prueba` desde `main`. No sobrescribir produccion antes de probar.
3. Descomprimir este ZIP y subir SU CONTENIDO a la raiz del repositorio: index.html, assets, icons, service-worker.js, manifest.webmanifest, version.json, _headers y archivos de documentacion.
4. Abrir vista previa de Cloudflare Pages; probar funciones con datos ficticios. Instalar esa vista previa en Safari para validar pantalla, teclado, foto y categorias.
5. Solo despues de aprobar en iPhone, fusionar la rama con `main` para actualizar https://confin.pages.dev/.
6. No desinstalar ConFin ni borrar los datos de Safari para limpiar cache.

## Datos y compatibilidad

Mantiene `confin-v4-data`, esquema 10 y respaldo previo local. Una instalacion existente NO recibe cambios en el significado de IDs existentes; por ejemplo, si `expense-food` ya tiene un nombre antiguo/personalizado, no se renombra. Los respaldos externos siguen siendo necesarios. No hay sincronizacion entre telefonos ni almacenamiento permanente de recibos.

## Validacion

Ver `COMPROBACIONES.md` y `AUDITORIA_5.3.9.md`. Las pruebas automatizadas ejecutadas son de Chromium con almacenamiento simulado, no de una PWA instalada en iPhone. No se comprobo el OCR externo real ni Face ID fisico. Esta version es RC1, no una certificacion libre de errores.
