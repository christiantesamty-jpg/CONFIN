# ConFin v3.3

Actualización limpia para iPhone:

- La estructura principal usa `position: fixed` con `top/right/bottom/left: 0`, sin `100vh`, `100dvh` ni alturas calculadas.
- La barra inferior queda anclada al borde real del viewport.
- Los presupuestos ahora se pueden editar o borrar.
- Se conserva el almacenamiento local `confin-data-v1`, por lo que los datos existentes no se migran ni eliminan al actualizar.
