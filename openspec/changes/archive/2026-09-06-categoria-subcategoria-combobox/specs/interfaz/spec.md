# Delta for Interfaz de usuario (navegación, tema y confirmaciones)

## ADDED Requirements

### Requirement: Selección de categoría y subcategoría con buscador por texto

Todo selector de categoría o subcategoría de la aplicación (crear/editar
movimiento, recategorizar en bloque, alta/edición de concepto previsto del
Resumen anual, mover una subcategoría a otra categoría) DEBE permitir
escribir para filtrar las opciones por texto, además de poder elegirse
desplegando la lista completa.

#### Scenario: Escribir filtra las opciones

- GIVEN un selector de categoría con varias categorías disponibles
- WHEN la persona usuaria escribe parte del nombre de una categoría
- THEN la lista desplegada se filtra a las categorías cuyo nombre coincide

#### Scenario: El valor elegido se conserva visible fuera de edición

- GIVEN un selector de categoría con una categoría ya elegida
- WHEN el desplegable no está abierto
- THEN el nombre de la categoría elegida se ve en el campo
