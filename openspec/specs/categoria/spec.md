# Especificación: Categoría y Subcategoría

## Propósito

Clasificar los movimientos en categorías y, dentro de cada categoría, en
subcategorías, ambas gestionables desde la interfaz.

## Requisitos

### Requisito: Alta de categoría

El sistema DEBE permitir crear una categoría con un nombre obligatorio y
único.

#### Escenario: Alta correcta
- Dado que no existe la categoría "Alimentación"
- Cuando se crea una categoría con nombre "Alimentación"
- Entonces la categoría aparece en el listado de categorías

#### Escenario: Nombre duplicado
- Dado que ya existe la categoría "Alimentación"
- Cuando se intenta crear otra categoría con el mismo nombre
- Entonces el sistema rechaza la operación

### Requisito: Edición y baja de categoría

El sistema DEBE permitir renombrar una categoría existente. El sistema DEBE
impedir eliminar una categoría que tenga subcategorías o movimientos
asociados.

#### Escenario: Baja bloqueada por subcategorías
- Dado que la categoría "Ocio y viajes" tiene al menos una subcategoría
- Cuando se intenta eliminar esa categoría
- Entonces el sistema rechaza la eliminación e informa del motivo

### Requisito: Alta de subcategoría

El sistema DEBE permitir crear una subcategoría con nombre obligatorio,
asociada a una categoría existente obligatoria. El nombre DEBE ser único
dentro de su categoría (pero PUEDE repetirse en categorías distintas).

#### Escenario: Alta correcta
- Dado que existe la categoría "Ocio y viajes" sin la subcategoría "Cafeterías y restaurantes"
- Cuando se crea esa subcategoría asociada a "Ocio y viajes"
- Entonces la subcategoría aparece bajo "Ocio y viajes" en el listado jerárquico

#### Escenario: Nombre duplicado dentro de la misma categoría
- Dado que la categoría "Ocio y viajes" ya tiene la subcategoría "Hotel y alojamiento"
- Cuando se intenta crear otra subcategoría "Hotel y alojamiento" en "Ocio y viajes"
- Entonces el sistema rechaza la operación

#### Escenario: Mismo nombre en categorías distintas permitido
- Dado que la categoría "Compras" tiene la subcategoría "Otros"
- Cuando se crea la subcategoría "Otros" en la categoría "Hogar"
- Entonces ambas subcategorías se crean sin conflicto

### Requisito: Edición y baja de subcategoría

El sistema DEBE permitir renombrar una subcategoría existente. El sistema
DEBE impedir eliminar una subcategoría que tenga movimientos asociados.

#### Escenario: Baja bloqueada por movimientos
- Dado que una subcategoría tiene al menos un movimiento asociado
- Cuando se intenta eliminarla
- Entonces el sistema rechaza la eliminación e informa del motivo

### Requisito: Listado jerárquico

El sistema DEBE permitir consultar las categorías junto con sus
subcategorías.

#### Escenario: Categoría sin subcategorías
- Dado que la categoría "Otros ingresos" no tiene ninguna subcategoría
- Cuando se consulta el listado jerárquico
- Entonces "Otros ingresos" aparece con una lista de subcategorías vacía
