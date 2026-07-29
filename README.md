# ConFin 5.1

Actualización limpia sobre la base 4.3, manteniendo la misma clave de datos para conservar la información existente.

## Incluye
- Layout único con CSS Grid: contenido desplazable + barra inferior independiente.
- Adaptación automática por tamaño de pantalla (compact, regular, large, xlarge).
- Safe areas de iPhone mediante `env(safe-area-inset-*)`.
- Temas centralizados con variables CSS.
- Tarjetas de crédito: límite, deuda, disponible, corte, vencimiento, pago mínimo y pago para no generar intereses.
- Recordatorios dentro de la app y notificación al abrir cuando el pago está próximo.
- Diagnóstico de pantalla en Configuración.

## Actualización
Sube todos los archivos reemplazando los actuales. No mezcles archivos individuales de versiones anteriores.


## Correcciones 5.1.1
- Formulario de ingresos, gastos y transferencias corregido.
- El botón flotante ya no envía el evento táctil como si fuera un movimiento existente.
- Validación defensiva antes de editar movimientos.
- Las notificaciones visuales se cierran al abrir formularios o cambiar de pantalla.
- Caché, manifiesto y archivos sincronizados con la misma versión.
