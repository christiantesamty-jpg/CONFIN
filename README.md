# ConFin 5.3.5 - Candidata RC1

Preparada el 27 de octubre de 2026 sobre ConFin 5.3.4. Aplicacion estatica completa, sin proceso de compilacion ni servicios nuevos de pago. Los JS y CSS sin minificar son tambien el codigo fuente. El icono CF original se conserva.

## Antes de publicar

Esta entrega es una candidata para probar, no una certificacion de Safari instalado. NO se ha publicado en confin.pages.dev. Primero exporta un respaldo desde cada iPhone por separado. No borres Safari, no desinstales la app y no subas los respaldos privados al repositorio.

## Una sola ruta recomendada: probar en una rama

1. En GitHub, dentro de CONFIN, crea una rama desde main llamada `confin-535-prueba`. Asegurate de seguir en esa rama, no en main.
2. Descomprime el ZIP de la aplicacion. Sube TODO su contenido a la raiz de esa rama: index.html, assets/, icons/, manifest.webmanifest, service-worker.js, version.json y _headers. Incluye los documentos de esta entrega. No subas el ZIP ni una carpeta contenedora.
3. Haz Commit changes en esa rama. En Cloudflare Pages, abre el despliegue Preview de la rama. Si las vistas previas estan deshabilitadas, habilitalas en la configuracion de despliegues de ramas; no cambies la rama de produccion.
4. Conserva Framework = None, Build command = vacio o `exit 0`, Build output directory = `.`. NO uses `npx wrangler deploy` ni crees otro Worker.
5. Prueba con datos ficticios primero. El enlace de vista previa tiene almacenamiento independiente del dominio principal; que aparezca vacio no significa que se hayan borrado tus datos. No lo conviertas en tu instalacion definitiva ni uses ahi tus credenciales Face ID de produccion.
6. Comprueba Historial mensual, Movimientos, registro/edicion, categorias, temas, metas, presupuestos y teclado en el iPhone. En Configuracion debe decir 5.3.5, Candidata RC1.
7. Solo despues de validar y autorizar, integra esa rama en main. Cloudflare publicara en el mismo dominio de siempre. No cambies dominio ni elimines datos.

La carpeta assets/5.3.5 debe subirse con su ruta intacta. No copies solo app.js. Los antiguos archivos app.js y styles.css de la raiz NO son referenciados por este index.html; se pueden retirar de la rama como limpieza despues de comprobar que no hay otros enlaces. No elimines a ciegas assets/ de versiones previas mientras puedan existir ventanas antiguas abiertas. No publiques .git, .wrangler, node_modules, pruebas ni datos personales.

## Como funciona esta entrega

- Month controls: anterior/siguiente, mes/anio, mes actual y todos los meses en Movimientos. Los meses vacios son consultables.
- Un solo CSS y estructura movil: encabezado, aviso de version, contenido desplazable y navegacion. El + se mantiene en el encabezado y no cubre tarjetas.
- Cantidades en centavos para los calculos; transferencias no suman como ingresos ni gastos.
- Presupuesto mensual o recurrente. Uno especifico sustituye al recurrente de esa categoria para ese mes, no se suman dos veces.
- Copias locales y validacion de datos, sin nube. Cada telefono conserva su propia informacion.
- Face ID sigue siendo una barrera de privacidad local, NO un almacenamiento cifrado. Prueba su alta, cancelacion y PIN en el dispositivo; no se ha verificado fisicamente aqui.
- Se conserva `confin-v4-data`; el esquema interno pasa a 9 al guardar por primera vez. Se conserva una copia del original antes de esa migracion.

## Actualizacion

En nuevas versiones usa una carpeta assets con un numero nuevo y actualiza version.json, el numero del programa y el Service Worker. No cambies archivos dentro de assets/5.3.5 despues de publicarlos: son inmutables para la cache. El worker mantiene su URL estable y se activa con confirmacion. El aviso se revisa al abrir o volver a la app con conexion, no con la app completamente cerrada.

## Datos y recuperacion

Las copias internas no sustituyen al archivo guardado fuera del navegador. Exporta con frecuencia, comprueba que realmente se guardo en Archivos y conserva el respaldo de cada persona por separado. Importar un respaldo completo reemplaza los datos despues de una vista previa; importar categorias no reemplaza los movimientos.

Si aparece Datos en recuperacion, no captures mas operaciones. Exporta el original y revisa/restaura una copia explicitamente. No borres el almacenamiento para resolver cache.

Antes de habilitar el bloqueo, configura y conserva el PIN de recuperacion. Si una instalacion antigua tiene Face ID activo pero ningun PIN, necesitaras desbloquear con esa credencial para configurar uno; no se incluye una confirmacion que permita saltar el bloqueo. Si ya no puedes desbloquear, conserva la instalacion y un respaldo: no borres datos intentando resolverlo.

## Reversion sin perder operaciones nuevas

Guarda el ZIP original y un respaldo anterior a actualizar. Si aun no hiciste cambios en la candidata, puedes volver al codigo original y a tu respaldo anterior en un entorno de prueba. Si YA registraste operaciones nuevas, exporta el estado actual antes de cualquier reversion. No restaures la copia anterior encima: perderias esas operaciones. Un codigo 5.3.4 puede ignorar campos de esquema 9, como el periodo de presupuesto; una reversion con nuevos datos requiere una version compatible o conversion revisada. No se promete un downgrade automatico.

## Prueba final en iPhone

Verifica la version de iOS real en Ajustes. Comprueba PWA instalada, vertical/horizontal, abrir/cerrar teclado, fondo y barra en cinco pantallas con listas cortas/largas, Face ID/PIN, guardado/reapertura y apertura sin Internet despues de preparar la cache. Si hay un hueco, copia Configuracion > Diagnostico de pantalla > Ver medidas. Incluye una captura y la version exacta de iOS; el diagnostico no contiene importes ni movimientos.

Consulta COMPROBACIONES.md para conocer que pruebas se ejecutaron y cuales estan pendientes.
