# ConFin 5.3.6 RC1 — Corrección de pantalla iPhone

**Base**: ConFin 5.3.5 RC1 (`ConFin_5.3.5_RC1_Meses_y_Movil(1).zip`).
**Referencia de diseño móvil**: código real de **VapeZone Business 2.18.4**. Se adaptaron sus decisiones de ventana, no se copió su lógica comercial.

## Qué se cambió (únicamente interfaz y diagnóstico)

**Diferencia observada en el iPhone 15 Pro Max**:
- Imagen de pantalla: 1290×2796 píxeles físicos / `devicePixelRatio=3` -> **430×932 píxeles CSS**.
- ConFin 5.3.5 informaba `window.innerHeight=873` y `safe-area-inset-top=59px`.
- 932−873 = **59px**, exactamente la dimensión de la zona superior. Esa coincidencia es compatible con la regresión de viewport de PWA instalada conocida en WebKit; no significa que un margen CSS de 59px la corrija.

**VapeZone Business 2.18.4**, a diferencia de ConFin 5.3.5, utiliza:
- `<meta name="apple-mobile-web-app-status-bar-style" content="default">` (en ConFin era `black-translucent`).
- Contenido en flujo normal del documento (`body` con margen cero y `.workspace {min-height:100vh}`), con barra de navegación móvil fija al borde.

**ConFin 5.3.6** ahora también:
1. Usa `status-bar-style=default`, para que iOS gestione por separado la zona de la barra de estado.
2. Elimina el contenedor general `position:fixed;height:100dvh` y los bloqueos de scroll del `html/body`.
3. Usa desplazamiento natural del documento y barra inferior `position:fixed;bottom:0`.
4. Reserva una sola vez la zona segura inferior en la barra, y espacio equivalente al final del contenido para no tapar movimientos.
5. Cambia la memoria de scroll de cada pantalla al scroll del documento.
6. Añade `screen.height`, diferencia frente al viewport y estilo de barra al diagnóstico.

No se modificaron funciones de movimientos, cuentas, tarjetas, categorías, presupuestos, metas, respaldo ni Face ID. Se conservó `confin-v4-data` y el esquema actual.

## Publicación en GitHub + Cloudflare Pages

1. En ConFin actual, exporta un respaldo a Archivos desde cada iPhone (el de cada persona por separado).
2. Descomprime **todo** el ZIP. Contiene `index.html`, `service-worker.js`, `manifest.webmanifest`, `version.json`, `_headers`, las carpetas `assets/` e `icons/`.
3. Sube los archivos y carpetas a la **raíz** del repositorio `CONFIN`, sustituyendo los archivos con el mismo nombre. No subas la carpeta contenedora ni el ZIP como archivo.
4. Asegúrate de subir `assets/5.3.6/` COMPLETA. Se incluye también `assets/5.3.5/` sin modificar para mantener compatibilidad con ventanas de la versión anterior.
5. Confirma el commit; Cloudflare Pages publicará la actualización automáticamente.
6. En iPhone, abre ConFin instalada. En Configuración consulta la versión o busca la actualización. Debe indicar `5.3.6 · Ajuste móvil RC1`.
7. Ve a **Inicio, Movimientos, Presupuestos, Metas, Cuentas y Configuración**. Desplaza cada pantalla hasta el final. Abre el formulario de ingreso/gasto y el teclado y vuelve a cerrarlo.
8. En Configuración → Diagnóstico de pantalla → Ver medidas, verifica `statusBarStyle: "default"` y envía el informe si todavía se observa una franja inferior.

### Si sigue apareciendo la franja

La barra de estado de una PWA instalada puede depender del estado de instalación del icono en iOS, no solamente del código descargado. Antes de desinstalar o borrar algo **exporta y comprueba un respaldo externo**. La actualización puede modificar el documento y CSS, pero no puede obligar a WebKit a renovar la geometría del icono de pantalla de inicio si iOS la conservó. No se garantiza una solución definitiva sin pruebas físicas de la nueva versión.

### Qué NO hacer

- No borres Safari ni la PWA para limpiar caché sin copia verificada.
- No cambies `confin.pages.dev` por un dominio nuevo solo para arreglar la pantalla: los datos son locales al dominio.
- No mezcles JS/CSS de `assets/5.3.5` con el `index.html` 5.3.6.

## Pruebas ejecutadas

- Sintaxis de los 3 archivos JavaScript relacionados.
- Navegación, ajuste horizontal y barra inferior en Chromium Linux a 320/375/390/430/768 px.
- 13 grupos de pruebas funcionales previos: **13/13 aprobados**.
- 6 grupos adicionales de regresión: **6/6 aprobados**.
- 8 pruebas rápidas de layout, meses, botones, tema y scroll de documento: **8/8 aprobadas**.
- 9 pruebas de motor financiero y 6 de Service Worker con simulación: **9/9 y 6/6 aprobadas**.

**Pendientes**: validar el comportamiento visual real en Safari instalada en iPhone y la actualización real por Cloudflare Pages (navegación local HTTP bloqueada en el entorno de pruebas; el navegador se ejecutó con recursos reales inyectados en `about:blank`). Los tests no son una certificación de funcionamiento en iPhone.
