# Delta for Manual de usuario interactivo

## ADDED Requirements

### Requirement: Tour de la página Importar

Al lanzarse desde `/importar`, el tour DEBE recorrer, tras la orientación,
un paso para el bloque "Importar movimientos" y un paso para el bloque
"Importar conceptos previstos", explicando en cada uno qué formatos admite
y que tras una importación con éxito aparece un resumen en ese mismo
bloque.

#### Scenario: El tour de Importar recorre ambos bloques por separado

- GIVEN la persona usuaria está en Importar
- WHEN pulsa el icono de ayuda
- THEN un paso resalta el bloque de importar movimientos y otro paso distinto resalta el bloque de importar conceptos previstos

### Requirement: Tour de la página Historial según haya categoría elegida

Al lanzarse desde Historial, si no hay ninguna categoría o subcategoría
elegida, el tour DEBE mostrar un único paso explicando que hay que
elegirla en el menú lateral, sin resaltar ningún otro elemento. Si hay una
categoría o subcategoría elegida, el tour DEBE recorrer los totales y la
evolución de gastos, los de ingresos, los filtros, el bloque de
resultados (tamaño de página, agrupar, exportar) y la tabla.

#### Scenario: Historial sin categoría elegida muestra un único paso

- GIVEN la persona usuaria está en Historial sin haber elegido ninguna categoría ni subcategoría
- WHEN pulsa el icono de ayuda
- THEN el tour muestra un único paso explicando que debe elegir una categoría o subcategoría en el menú lateral

#### Scenario: Historial con una categoría elegida recorre todo su contenido

- GIVEN la persona usuaria ha elegido una categoría en el menú lateral y está en su Historial
- WHEN pulsa el icono de ayuda
- THEN el tour recorre la evolución de gastos, la de ingresos, los filtros, el bloque de resultados y la tabla

### Requirement: Tour de la página Resumen anual

Al lanzarse desde `/resumen-anual`, el tour DEBE recorrer, tras la
orientación, los botones de importar y exportar Excel, el botón de cargar
el acumulado real, el botón de añadir concepto, el campo de año, el campo
de buscar, el interruptor de agrupar por categoría, y las tablas de gastos
e ingresos.

#### Scenario: El tour de Resumen anual recorre todas sus partes

- GIVEN la persona usuaria está en Resumen anual
- WHEN pulsa el icono de ayuda
- THEN el tour resalta, en algún momento del recorrido, cada uno de: importar, exportar, cargar acumulado real, añadir concepto, año, buscar, agrupar por categoría, y las tablas

### Requirement: Tours de las páginas de Administración

Cada una de las 3 sub-páginas de Administración (Realizar backup,
Importar backup, Gestión de conceptos) DEBE tener su propio tour,
independiente de las otras dos, sin navegar automáticamente entre ellas.
El tour de Importar backup DEBE advertir en su texto de que es una acción
destructiva que sustituye todos los datos.

#### Scenario: El tour de Gestión de conceptos recorre sus formularios y tablas

- GIVEN la persona usuaria está en Administración → Gestión de conceptos
- WHEN pulsa el icono de ayuda
- THEN el tour recorre el formulario de asociación por categoría, el de asociación por descripción, el botón de crear asociación, y las tablas de asociaciones ya creadas

#### Scenario: El tour de Importar backup advierte del riesgo

- GIVEN la persona usuaria está en Administración → Importar backup
- WHEN pulsa el icono de ayuda
- THEN el paso correspondiente menciona que la importación sustituye toda la información actual
