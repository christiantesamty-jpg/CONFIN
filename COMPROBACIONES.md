# Comprobaciones — ConFin 5.3.6 RC1

## Comparación concreta: ConFin 5.3.5 vs VapeZone Business 2.18.4

| Componente | ConFin anterior | VapeZone Business 2.18.4 | ConFin 5.3.6 |
| --- | --- | --- | --- |
| Meta iOS status bar | `black-translucent` | `default` | `default` |
| Raíz de contenido | `fixed; inset:0; block-size:100dvh` | `.workspace { min-height:100vh }`, documento desplazable | `position:relative; min-height:100vh` |
| Scroll principal | `#view { overflow-y:auto }` con `html/body overflow:hidden` | scroll normal del documento | scroll normal del documento |
| Navegación móvil | como fila de grid dentro del fijo | `position:fixed; bottom:0` | `position:fixed; bottom:0` |
| Área inferior | safe bottom solo en barra | safe bottom solo en barra | safe bottom solo en barra y espacio final del contenido |

No se copiaron componentes financieros, marcas, datos de clientes ni código de negocio de VapeZone a ConFin.

## Pruebas automáticas

- JavaScript `node --check`: **correcto** (app, core y service worker).
- Motor financiero aislado: **9/9**.
- Simulación del ciclo del service worker: **6/6**.
- UI en Chromium: **13/13** grupos funcionales y **6/6** adicionales.
- UI adicional focalizada: **8/8** casos (rutas, barra fija, ancho, historial mensual, selector de movimientos, crear ingreso, tema y desplazamiento).
- Anchos: 320, 375, 390, 430 y 768 píxeles. Altura 932. La barra permaneció anclada al viewport y no se detectaron desbordamientos horizontales en las rutas verificadas.
- Con zona segura inferior simulada de 34 px, la barra quedó con altura total de 100 px y anclada al borde inferior del viewport.

## Lo que falta validar físicamente

1. En el iPhone 15 Pro Max, **abrir la PWA instalada**, preferiblemente después de que el nuevo build esté activo. Probar sin reinstalar primero.
2. Comprobar que la franja extra ya no aparece y el indicador de inicio queda debajo de la barra respetando la zona segura.
3. Comprobar scroll al último movimiento, tanto con pocos como con muchos registros.
4. Abrir y cerrar teclado en ingreso/gasto, navegar entre meses, cambiar paleta, Face ID y PIN.
5. Copiar diagnóstico: `screen.height`, `inner.height`, `safeArea.top`, `safeArea.bottom`, `statusBarStyle` y rectángulo de navegación.
6. Si el icono instalado mantiene un contexto WebKit creado anteriormente, la corrección de metadatos podría requerir reinstalación **solo con respaldo externo verificado**.

## Estado

**Versión candidata**: no se ha probado físicamente en Safari instalada, no se publicó en producción y no se alteraron datos del usuario. No afirmar “corregido definitivamente” hasta que se compruebe en el dispositivo.
