# Especificación: Historial

## Propósito

Permitir navegar la evolución histórica de una categoría o subcategoría del
árbol de categorías, mostrando todos sus movimientos de cualquier fecha, de
forma coherente con lo que ya muestra el Resumen anual para ese mismo
concepto.

Nota: esta spec documenta únicamente el requisito de coherencia con las
asociaciones, corregido en esta sesión; no reemplaza ni documenta el resto de
funcionalidad de Historial (filtros, gráficos, agrupación) ya existente antes
de este cambio y sin spec previa.

## Requisitos

### Requisito: Navegación coherente con las asociaciones del Resumen anual

Al navegar a una categoría o subcategoría desde el menú lateral de Historial,
el sistema DEBE mostrar los mismos movimientos que el Resumen anual
encontraría para ese concepto: los de su categoría/subcategoría real (a
través de una asociación por concepto, si la hay) más los de cualquier
asociación por descripción configurada para esa categoría/subcategoría, sin
duplicar los que coincidan por ambas vías.

#### Escenario: Subcategoría con movimientos solo localizables por asociación de descripción
- Dado que existe una asociación por descripción que vincula el fragmento "Amazon Prime" con la subcategoría "Suscripciones → Amazon Prime"
- Y existe un movimiento cuya descripción contiene "Amazon Prime" pero cuya categoría real es otra distinta
- Cuando se navega en Historial a "Suscripciones → Amazon Prime"
- Entonces ese movimiento aparece en el listado de Historial

#### Escenario: Categoría sin ninguna asociación se comporta igual que antes
- Dado que una categoría no tiene ninguna asociación por concepto ni por descripción configurada
- Cuando se navega en Historial a esa categoría
- Entonces se muestran únicamente los movimientos cuya categoría real coincide literalmente
