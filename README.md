# ConFin 5.3.1 — Categorías personalizadas

Actualización construida sobre la base estable ConFin 5.3.0.

## Cambios
- Categorías personalizables de gastos e ingresos.
- Nombre, emoji y color editables.
- Categorías personalizadas incluidas en exportación e importación.
- Protección al eliminar categorías utilizadas: primero se reasignan los movimientos.
- IDs internos estables para conservar movimientos al renombrar.
- Barbería / Estética y GymPass agregadas como gastos predeterminados.
- Educación y Ahorro ya no aparecen para movimientos nuevos; los movimientos históricos se conservan.

## Conservación de datos
Mantiene la clave localStorage `confin-v4-data` y migra los datos existentes sin borrar movimientos, cuentas, presupuestos, metas ni configuración.
