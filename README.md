# ConFin 5.3.4 — Estabilidad, finanzas e interfaz iPhone

Actualización integral y **conservadora** de la base funcional ConFin **5.3.3**. No utiliza el proyecto experimental de ConFin 6.0. La clave de almacenamiento sigue siendo **`confin-v4-data`**.

## Antes de publicar (muy importante)

1. Desde **cada iPhone**, entra a la app actual y usa **Configuración > Exportar respaldo**. Abre **Archivos** y confirma que el JSON se descargó y existe. Guarda una segunda copia fuera del dispositivo.
2. **No borres la app, los datos de Safari, ni cambies de dominio** antes de respaldar. El almacenamiento local pertenece al dominio y a cada dispositivo; pasar de `github.io` a `pages.dev` no traslada el historial.
3. Conserva la versión anterior en GitHub (idealmente en una rama o descarga ZIP). Prueba primero en una URL de vista previa de Cloudflare Pages, con datos de prueba, antes de publicarla en `main`.
4. Para publicar, sube **todo el contenido del ZIP** a la raíz de tu repositorio `CONFIN`, conservando las carpetas `icons/` y los nombres de archivo. No mezcles archivos de ConFin 6.0 ni elimines tu copia de seguridad de los datos.
5. Al publicar en el **mismo dominio que ya tiene datos**, vuelve a abrir ConFin; si ofrece **Nueva versión disponible**, utiliza **Actualizar ahora**. Verifica saldos, ingreso/gasto del mes, movimientos, presupuesto, metas y Face ID.

## Mejoras incluidas

- **Protección de datos:** no se sobrescribe el respaldo local si la copia principal está corrupta; validación en importación, vista previa antes de reemplazar, punto de restauración y recuperación ante errores de escritura.
- **Categorías:** exportación e importación *solo de categorías* para compartir nombres, emojis y colores entre teléfonos sin tocar los movimientos; creación, edición y reasignación de categorías conservadas.
- **Finanzas:** presupuestos calculados solo con gastos asociados a categorías presupuestadas; gastos fuera de presupuesto se muestran separados; impide borrar cuentas vinculadas a movimientos; correcciones de cálculos y fechas locales.
- **Inicio:** historial mensual desplegable al final de Inicio, con ingresos, egresos, ahorro neto, porcentaje de ahorro y categorías de mayor gasto. El promedio de ahorro es negativo si hay déficit y se informa si no hay ingresos.
- **Movimientos:** búsqueda, filtro por mes, paginación eficiente y botón Repetir que abre un borrador (no lo guarda por sí solo).
- **iPhone:** barra de navegación anclada, contenido central con scroll, áreas seguras adaptables, dimensiones flexibles y tarjetas sin desbordamiento. En pantallas pequeñas el botón verde `+` se traslada a la cabecera para que no tape tarjetas.
- **Privacidad:** recuperación con PIN al configurar el bloqueo mediante Face ID (WebAuthn). Face ID en una PWA sin servidor **no cifra los datos ni ofrece autenticación bancaria**. Las instalaciones antiguas sin PIN tienen compatibilidad de recuperación de legado.
- **Actualizaciones:** versiones coordinadas `5.3.4`, archivos CSS/JS cacheados por versión, descarga de nueva versión controlada y sin servir HTML como fallback de JavaScript.

## Dos o más usuarios

Sin un servidor, **cada teléfono tiene datos independientes**: no existe sincronización automática. Para copiar únicamente categorías, usa **Exportar categorías** en un dispositivo e **Importar categorías** en el otro. Importar el *respaldo completo* reemplaza los movimientos de ese dispositivo (se solicita confirmación). No es adecuado para fusionar automáticamente movimientos de dos usuarios.

## Limitaciones y pruebas necesarias

- Los respaldos internos en `localStorage` no protegen contra un borrado del sitio, cambios de dominio, pérdida del teléfono o limpieza de Safari. Exporta JSON regularmente.
- ConFin se probó con navegador Chromium automatizado y diversos tamaños de pantalla, y se validaron cálculos y operaciones de datos. **No se probó físicamente en iPhone ni en Safari standalone real**; las versiones de iOS pueden tener peculiaridades de WebKit y áreas seguras. Revisa el dispositivo antes de declarar corregido un problema específico de iOS.
- La interfaz no garantiza que sea imposible perder datos: el almacenamiento local puede ser eliminado por el usuario, el sistema o por falta de espacio.
- No se añadió sincronización en la nube, avisos push remotos, conciliación entre dispositivos, ni autenticación WebAuthn con verificación criptográfica de servidor (requieren otra arquitectura).

Detalles de pruebas ejecutadas: `COMPROBACIONES.md`.
