# Pruebas y limites - ConFin 5.3.9 RC1

## Base de codigo

Partiendo de `ConFin_5.3.8_PERSONALIZACION_INVERSIONES_Y_COBROS_RC1.zip` se actualizaron recursos versionados a `assets/5.3.9/`; se mantuvo el Service Worker que reconstruye respuestas para evitar redirecciones en Safari.

## Pruebas realmente ejecutadas

- **21/21 aserciones**: arranque, categorias exactas 28+9 e IDs, nota primero, busqueda, registro de gastos/ingresos, totales, orden, presupuesto mensual, parser OCR, sugerencia de monto con OCR simulado y desbordamientos.
- **17/17 verificaciones de migracion y pantalla**: datos 5.3.8 con movimientos y categorias previas, conservacion de IDs, nombres, archivos, saldos, presupuesto, meta, copia previa, no duplicacion en recarga y ausencia de desbordamiento horizontal en 320, 360, 375, 390, 430 y 768 px.
- **25/25 grupos de interacciones**: abrir formularios, cambiar ingreso/gasto, gestionar categorias, orden persistente, botones horizontales, selector de mes y ano, sugerencia OCR simulada, guardar y ausencia de errores JavaScript observados.
- **Service Worker**: simulacion de redireccion de raiz; no devuelve respuesta de navegacion con metadatos `redirected=true`.
- **Sintaxis y estructura**: `node --check` de scripts, JSON validos y ZIP integro (validar de nuevo al generar).

Las pruebas de navegador se hicieron en **Chromium con DOM/CSS/JS reales y almacenamiento simulado**. No se ejecuto una instalacion real de PWA en iPhone ni se probo su actualizacion real desde Cloudflare.

## Lo que NO se ha probado y NO debe darse por aprobado

- Safari iOS 18.7 instalado en iPhone 15 Pro Max: pantalla completa, desplazamiento, teclado, fotografias, control tactil.
- Descarga en vivo de Tesseract.js y OCR de un recibo fotografiado, ni exactitud estadistica de totales. Solo heuristicas y comportamiento con OCR simulado.
- Face ID o PIN en hardware.
- Cambio de Service Worker con cache instalada desde 5.3.8 y datos personales reales.
- Cuotas reales y falta de espacio en Safari.
- Retencion permanente de fotografias: NO implementada por seguridad de almacenamiento.

## Validacion manual recomendada

1. Crear vista previa por rama, con datos ficticios.
2. Ingresar gasto con nota, monto y categoria; guardar y comprobar cuenta y totales. Repetir con ingreso.
3. En Configuracion ordenar categorias, recargar, editar nombre/emojis, archivar y verificar persistencia.
4. En Presupuestos seleccionar Mes especifico, mes/ano, guardar, editar y confirmar que ningun campo se salga de pantalla.
5. En Gastos probar Tomar foto y Elegir foto. Verificar que el monto sugerido requiere pulsar Usar este monto, y despues Guardar. Si falla, usar captura manual.
6. Revisar inversiones, cuentas por cobrar, metas, historial mensual, apariencias, respaldo y barra inferior.
7. Probar abrir/cerrar app instalada, sin pantalla en negro ni `Response served by service worker has redirections`.
8. Solo despues actualizar main, guardando respaldo externo de cada usuario.
