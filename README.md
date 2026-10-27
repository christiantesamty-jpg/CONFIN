# ConFin 5.3.8 — Personalización y patrimonio · RC1

Esta candidata parte **directamente de ConFin 5.3.7**, la versión que recuperó la carga en Safari. Conserva su modelo de desplazamiento en documento, metadatos PWA y protección contra respuestas redirigidas del Service Worker.

## Nuevas funciones

- 11 paletas: Midnight Premium, Graphite, Ocean Blue, Emerald, Ivory, Burgundy, AMOLED Black, Sand claro, Violeta, Bronce oscuro y Claro. Se mantienen los identificadores de los temas anteriores para preservar preferencias.
- Tipografía y componentes responsive consistentes. Todas las paletas utilizan tokens semánticos CSS para fondo, tarjetas, texto, acento, éxito y error.
- Configuración ordenada, con accesos a pantallas independientes para categorías de ingresos y gastos.
- Inversiones dentro de Cuentas: aportación, retiro, registro de rendimiento cobrado, actualización manual de valor, historial, resultado acumulado y archivo. Anulación protegida de una inversión que solo tenga la aportación inicial.
- Cuentas por cobrar: préstamo desde cuenta disponible, abonos parciales, interés cobrado, liquidación y consulta de historial. El resumen de pendientes aparece únicamente si existen importes por cobrar; siempre puedes iniciar un nuevo registro.
- Resumen patrimonial sin contar dos veces las transferencias.
- Compatibilidad de respaldos y de la clave local `confin-v4-data`.

## Modelo financiero

Una aportación o retiro de inversión y un préstamo o recuperación de capital **no se contabilizan como ingreso o gasto ordinario**. Solo los rendimientos e intereses **efectivamente cobrados** generan ingreso en el mes de cobro y aparecen como registros de lectura en Movimientos. Los precios de inversiones se capturan manualmente; modificar el valor estimado no crea ingresos ni mueve dinero.

Resultado de inversión simple = valor actual + retiros + rendimientos cobrados − aportaciones. Porcentaje de rendimiento simple = resultado / aportaciones, si existen aportaciones. No es una tasa anualizada ni TIR. El patrimonio neto usa los saldos de todas las cuentas, más inversiones separadas, más capital por cobrar; las tarjetas de crédito ya están representadas como saldos negativos en ese total. Si ya usabas cuentas de tipo inversión, no registres nuevamente el mismo capital en la nueva cartera.

Las cuentas por cobrar no se muestran como dinero disponible para gastar. La fecha esperada de pago sirve para señalar vencimientos; no se envían alertas automáticas mientras la app esté cerrada.

## Cómo publicarlo (GitHub + Cloudflare Pages)

1. Exporta un respaldo externo por separado en cada iPhone.
2. **Primero prueba en una rama**, por ejemplo `confin-538-rc1`; no sobrescribas `main` antes de comprobar el iPhone.
3. Descomprime el ZIP y sube **el contenido** a la raíz del repositorio CONFIN: `index.html`, `service-worker.js`, `version.json`, `manifest.webmanifest`, `_headers`, `assets/` e `icons/`.
4. Cloudflare Pages publicará una vista previa de esa rama. Comprueba navegación, categorías, inversiones, préstamos y posición de la barra inferior en el iPhone.
5. Si todo funciona, incorpora los cambios en `main`; conserva el respaldo anterior y no desinstales la app.

Si decides publicar directamente en `main`, puedes hacerlo, pero perderías la oportunidad de probar primero esta candidata sin afectar producción. No borres Safari ni la aplicación instalada para resolver una actualización; primero conserva los respaldos.

## Protección de datos

Los datos se almacenan localmente por dispositivo; no hay sincronización ni nube. La primera escritura desde un respaldo del esquema 9 crea una copia local previa bajo `confin-pre-5.3.8` antes de guardar el esquema 10. Además, los respaldos exportados incluyen inversiones, registros por cobrar y sus operaciones. Las copias dentro del navegador no sustituyen un respaldo externo. El desbloqueo mediante Face ID/PIN sigue siendo una barrera de privacidad local, no cifrado de los datos.

## Limitaciones de esta candidata

Se hicieron pruebas automatizadas en Chromium con dimensiones móviles y simulación de almacenamiento local, y pruebas aisladas del Service Worker simulando respuestas redirigidas de Cloudflare. **No** se ejecutó una PWA real instalada en Safari ni se validó Face ID en hardware; tampoco fue posible navegar al servidor HTTP local desde el navegador del entorno por una restricción del sistema. La validación final corresponde a un iPhone con una vista previa real por HTTPS. No publiques datos de prueba personales ni archivos de respaldo en GitHub.

Ver `COMPROBACIONES.md` para detalles verificables.
