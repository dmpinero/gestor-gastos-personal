# Delta for Categoría y Subcategoría

## ADDED Requirements

### Requirement: Alta de categoría o subcategoría al recategorizar movimientos en bloque

Al cambiar la categoría de varios movimientos seleccionados a la vez, el
sistema DEBE permitir dar de alta una categoría o subcategoría nueva sin
cerrar el diálogo, dejándola elegida para aplicarla directamente a los
movimientos seleccionados.

#### Scenario: Crear una categoría nueva desde el diálogo de recategorización en bloque

- GIVEN la persona usuaria tiene varios movimientos seleccionados y ha abierto "Cambiar categoría"
- WHEN pulsa el botón de crear categoría, indica un nombre y confirma
- THEN la categoría nueva queda elegida en el diálogo, lista para aplicarse con "Aplicar"

#### Scenario: El botón de crear subcategoría requiere una categoría ya elegida

- GIVEN el diálogo de recategorización en bloque está abierto sin ninguna categoría elegida
- WHEN la persona usuaria mira el botón de crear subcategoría
- THEN el botón aparece deshabilitado hasta que se elija una categoría
