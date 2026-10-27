# Informe de entrega - ConFin 5.3.5, Candidata RC1

Fecha: 27 de octubre de 2026. Base: ConFin 5.3.4. No se modifico ni publico produccion.

## 1. Base y trazabilidad

ZIP original: ConFin_v5.3.4_AUDITORIA_ESTABILIDAD_Y_IPHONE.zip
SHA-256: 6284de21b399b3ff83b42e8ce393e7d215f5c07dd0f11215adc9519b87347ff3

Se mantuvo la extraccion original intacta. Se refactorizo su aplicacion estatica, sin cambio de framework ni dependencias de ejecucion. No es otra version 6.0. Los iconos CF mantienen exactamente los bytes originales. La clave personal continua siendo `confin-v4-data`, con validacion y esquema interno 9.

## 2. Causa funcional reproducida

En el app.js original, linea 664, el manejador global ejecutaba `e.target.closest("[data-theme]")`. La funcion applyTheme asignaba data-theme al elemento HTML. Un clic ordinario dentro de un selector o desplegable alcanzaba esa raiz, ejecutaba save y render y sustituia la vista completa.

Prueba sobre la copia original: al pulsar el selector transactionMonth, el elemento coincidente fue HTML, el selector original dejo de estar conectado al documento y se escribio el respaldo sin una modificacion de datos. El sintoma se reprodujo en Chromium con DOM local.

Correccion: la accion de cambiar tema se limita a `button[data-theme]`. La regresion ahora comprueba que pulsar selects y buscador no escribe el almacenamiento ni destruye el control. Tambien se sustituyo la lista limitada a meses con movimientos por un selector compartido con meses vacios, botones anterior/siguiente, seleccion directa y estado independiente por apartado.

No se atribuye este fallo a Safari ni a Cloudflare. No fue necesario reconstruir toda la app para corregirlo.

## 3. Cambios entregados

### Navegacion y meses

- Selector reutilizable de mes y anio para Historial, Movimientos y Presupuestos.
- Anterior/siguiente, mes actual y seleccion directa; Todos los meses para Movimientos.
- Meses sin registros muestran ceros, no desaparecen de las opciones.
- Historial no altera el resumen del mes actual en Inicio. Ediciones y filtros conservan el periodo seleccionado.
- Los cambios de periodo actualizan el resultado, no sustituyen innecesariamente la interfaz completa.
- Busqueda por nota, categoria o cuenta, filtros compatibles y lista progresiva de 40 registros.

### Estructura movil

- Sustitucion completa del CSS acumulado por una hoja unica con tokens de tema y componentes compartidos.
- Cuadricula explicita de encabezado, aviso, contenido y navegacion. La altura no depende de la cantidad de registros.
- viewport-fit=cover, altura dinamica con fallback y areas seguras aplicadas una vez. No se fuerza screen.height ni una franja artificial por modelo.
- Solo el contenido principal se desplaza; el boton + esta en el encabezado. No hay una capa flotante que cubra la lista.
- El modal se adapta al viewport visual cuando hay teclado, sin usar esas medidas para alterar la altura permanente de la app.
- Fechas, textos largos, cantidades negativas y millones tienen limites de ancho y ajuste. Tema claro con contraste medido.
- Diagnostico copiable de rectangulos, pantalla, area segura y version, sin datos financieros.

### Calculos y formularios

- Modulo puro core.js para centavos enteros, fechas locales, totales, saldos y agrupaciones.
- Ingresos/gastos excluyen transferencias; ahorro negativo permitido y porcentaje no calculable sin ingresos.
- Debito, deuda y patrimonio se distinguen; credito disponible no se suma al dinero propio.
- Abonos parciales no duplican gastos; sobrepago se rechaza. Un saldo a favor existente no se convierte silenciosamente en deuda.
- Presupuestos recurrentes o de mes concreto, sin doble conteo de la misma categoria; exceso real y no presupuestado aparte.
- Metas conservan informacion manual y fecha objetivo opcional; no incrementan de nuevo los activos.
- Se preservan borradores al cambiar el tipo de movimiento. No se permite doble alta por el mismo identificador.

### Datos y seguridad

- No se reemplazan IDs, emojis, colores ni decisiones de archivo con listas predeterminadas.
- Archivo y reactivacion de categorias de ambos tipos; migraciones idempotentes y validaciones de referencias/importes.
- Copia original antes de la primera migracion, copias rotativas y restauracion explicita.
- Un principal danado entra en modo protegido; no se reemplaza silenciosamente ni contamina una copia buena.
- Si falla la escritura, se mantiene el borrador y el estado persistido; no se muestra un exito falso.
- Importacion con validacion y vista previa. Respaldo de categorias independiente de movimientos. Credenciales y PIN no se exportan con los datos financieros.
- Control optimista de cambios de otra ventana; no se promete atomicidad ante escrituras exactamente simultaneas.
- Face ID se conserva como bloqueo de privacidad sin cifrado. Se retira la omision mediante simple confirmacion para instalaciones antiguas sin PIN y se limita el intento de PIN. Enrolamiento real, verificacion biometrica y robustez de autenticacion no estan certificados.

### Publicacion y actualizaciones

- Recursos en assets/5.3.5, Service Worker de URL estable, version.json fuera de cache y activacion con consentimiento.
- Los scripts/estilos no reciben HTML como fallback sin conexion; la descarga incompleta no activa la version nueva.
- Se conserva una generacion anterior de cache y no se borran caches ajenas.
- Aviso de nueva version sin reemplazar un formulario activo.
- Archivo _headers para Cloudflare; no se han validado esos encabezados mediante un despliegue real.

## 4. Pruebas ejecutadas

Se ejecutaron sobre los archivos finales de `public/`, no sobre una maqueta diferente. El empaquetado de JS y CSS fue verificado por SHA-256 contra el contenido probado.

Entorno: Linux, Node 22.16.0, Chromium 144.0.7559.96, Playwright 1.57.0.

LIMITACION DEL ENTORNO: Chromium tiene una politica que bloquea navegar a URLs, incluido localhost y archivos. No se cambio esa politica. Se cargo el HTML/CSS/JS exacto en about:blank mediante Playwright, con DOM real y clics/toques/selects reales. El almacenamiento se sustituyo por un adaptador en memoria y la consulta de version por respuestas controladas. Por tanto NO es una prueba de origen HTTPS, cuota real, instalacion PWA ni red.

La descarga de WebKit no fue posible por resolucion DNS/red del entorno. No se ejecuto Safari/WebKit ni un iPhone fisico.

Resultados: 19 grupos de navegador aprobados (13 funcionales + 6 adicionales); 9 grupos de calculos y fechas aprobados en Node; 6 grupos de ciclo de Service Worker aprobados con Cache API simulada. Total: 34 grupos, no 34 dispositivos ni 34 pruebas de Safari.

### Aceptacion mensual, con los selectores de interfaz

| Periodo de prueba | Ingresos | Gastos | Ahorro neto | Porcentaje |
|---|---:|---:|---:|---:|
| Julio 2026 | 10000 | 3000 | 7000 | 70.0% |
| Agosto 2026 | 20000 | 8000 | 12000 | 60.0% |
| Septiembre 2026 | 0 | 500 | -500 | No calculable: sin ingresos |
| Octubre 2026 | 1000 | 1500 | -500 | -50.0% |
| Febrero 2026, sin datos | 0 | 0 | 0 | No calculable: sin ingresos |

Se seleccionaron los meses abriendo el control, usando el select nativo de mes y el campo de anio y confirmando Ver mes. Se comprobaron cambios enero/diciembre y que Inicio mantuviera sus valores del mes actual. No se limitaron las pruebas a llamar la funcion de calculo.

### Flujos y regresiones

Navegacion, alta/edicion/borrado de ingresos y gastos, cambio de fecha entre meses, filtros/busqueda, categorias de ambos tipos con emoji compuesto, archivo/reactivacion, metas, presupuestos especificos/recurrentes/duplicados, importacion valida/invalida, datos corruptos, fallo simulado de escritura y cambios de otra ventana.

Credito: debito 50000 y deuda 10000; pago4000 => 46000 y6000; pago6000 => 40000 y0. Ningun pago suma gastos. Sobrepago rechazado.

Layout: anchos 320,360,375,390,430,768; cinco pantallas principales; cinco paletas; horizontal932x430; cantidades positivas/negativas grandes. No se detecto overflow horizontal en las comprobaciones ejecutadas. Se abrieron formularios y el control de fecha. Contraste medido en el tema claro para cuatro pares de color >=4.5:1.

Area segura SIMULADA: alto932, ancho430, top59 y bottom34. Las cinco pantallas colocaron la navegacion en y832 con alto100 (66 de contenido y34 seguros). El borde inferior coincide con932. Simulacion de teclado con viewport visible570: modal y Guardar alcanzables, barra de la app sin variar su rectangulo. Estas medidas NO certifican lo que devuelve Safari en el iPhone del usuario.

Rendimiento observado: 10000 movimientos sinteticos, 2196023 bytes serializados. Arranque medido 0.327 segundos y busqueda 0.147 segundos. Medicion de una corrida en Chromium Linux, DOM offline y almacenamiento en memoria; no representa carga de red, dispositivo movil ni capacidad efectiva de localStorage.

## 5. Pendientes y limites honestos

1. iPhone fisico: PWA instalada, version exacta iOS, teclado real, orientacion, dimensiones y espacio inferior. No se puede afirmar que el hueco particular del usuario haya desaparecido sin esa comprobacion.
2. Actualizacion HTTPS real desde5.3.4, instalacion/espera/activacion del Service Worker, apertura offline, encabezados y CSP de Cloudflare. Se verifico el codigo y se simulo su ciclo; no se publico para probarlo.
3. Face ID, credencial y PIN reales. El bloqueo no cifra datos y no es un sistema de autenticacion verificado por servidor. El dato local sigue legible en un dispositivo/navegador con acceso.
4. localStorage sigue siendo finito. Las copias internas consumen espacio adicional; 10000 registros sinteticos en memoria no garantizan cabida con todas las copias. La escritura fallida se maneja, pero no se ha implementado IndexedDB.
5. Dos ventanas: prueba de conflicto secuencial simulada. No hay una transaccion entre pestanas contra una carrera exactamente simultanea.
6. Falta una prueba especifica de todas las configuraciones de accesibilidad del sistema y zoom/texto ampliado en iOS. El zoom no se deshabilito en el viewport.
7. No se ha cotejado un respaldo real del usuario; las pruebas usan datos sinteticos, sin publicar saldos personales. Una entrada invalida se detiene en lugar de descartar registros.
8. No se incorporaron nube, sincronizacion, recurrentes automaticos, IA, widgets ni notificaciones programadas con la app cerrada.

## 6. Riesgo de migracion y reversion

La primera escritura crea la copia del dato original y verifica el nuevo. Conservar la clave no garantiza por si solo compatibilidad; por eso se validan estructura, referencias, campos monetarios y limites. Las copias locales tampoco son infalibles: guarda un archivo externo por cada dispositivo.

Un downgrade a5.3.4 despues de registrar datos nuevos podria ignorar campos nuevos (por ejemplo presupuestos mensuales). Antes de revertir, exporta el estado actual. No restaures un respaldo anterior encima de movimientos posteriores. Solo vuelve a la copia previa cuando no haya cambios que conservar o cuando exista una conversion revisada.

## 7. Publicacion propuesta

Probar el ZIP completo en una rama de vista previa, sin cambiar main ni el dominio de produccion. Validar con datos sinteticos y despues en el iPhone. La direccion de vista previa usa almacenamiento independiente; no es el nuevo domicilio de la app. Tras autorizar la candidata, integrar la rama a produccion manteniendo confin.pages.dev.

El ZIP de pruebas es para reproducir/verificar; NO se sube a Cloudflare. El ZIP de aplicacion es el unico paquete publicable. No requiere npm, Vite ni compilacion.

## Referencias consultadas

- https://webkit.org/blog/7929/designing-websites-for-iphone-x/
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- https://web.dev/articles/service-worker-lifecycle
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API
- https://playwright.dev/docs/emulation
- https://developers.cloudflare.com/pages/configuration/preview-deployments/

Estas referencias fundamentan decisiones de implementacion; no sustituyen los resultados de pruebas ni certifican esta app.
