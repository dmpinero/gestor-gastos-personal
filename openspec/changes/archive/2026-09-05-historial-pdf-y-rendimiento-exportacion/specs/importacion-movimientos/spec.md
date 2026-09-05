# Delta for Importación de movimientos (antes "Importación de movimientos desde Excel")

Este dominio se renombra de "importacion-excel" a "importacion-movimientos":
ya no es exclusivo de Excel, así que su propósito y su nombre se generalizan.
Todos los requisitos existentes de Excel se mantienen sin cambios; los
siguientes son nuevos, específicos del formato PDF.

## ADDED Requirements

### Requirement: Subida de un certificado de movimientos en PDF

El sistema DEBE permitir subir un fichero PDF con un certificado de
movimientos (formato ING: fecha, concepto, importe, saldo) desde la misma
zona de subida que el Excel, sin necesitar una sección separada de la
interfaz.

#### Escenario: PDF válido
- Dado un certificado de movimientos en PDF con el formato esperado
- Cuando se sube para importar
- Entonces el sistema lo reconoce como PDF y extrae sus movimientos

#### Escenario: PDF sin cabecera reconocible
- Dado un PDF que no contiene un número de cuenta reconocible
- Cuando se intenta importar
- Entonces el sistema rechaza el fichero e informa de que no lo reconoce

#### Escenario: PDF sin movimientos
- Dado un PDF con cabecera válida pero sin ninguna fila de movimiento
- Cuando se intenta importar
- Entonces el sistema informa de que no hay movimientos que importar

### Requirement: Autocategorización de movimientos importados desde PDF

Dado que el certificado en PDF no incluye categoría ni subcategoría, por cada
movimiento el sistema DEBE buscar una asociación por descripción ya
configurada (las mismas que usan Resumen anual e Historial) y, si coincide,
DEBE asignar la categoría/subcategoría de esa asociación. Si ninguna
asociación coincide, DEBE asignar la categoría "Sin categorizar" (creándola
si no existe todavía), para que el movimiento quede localizable y revisable
manualmente.

#### Escenario: Descripción coincide con una asociación existente
- Dado que existe una asociación por descripción para el fragmento "Amazon Prime"
- Cuando se importa un movimiento del PDF cuya descripción contiene "Amazon Prime"
- Entonces el movimiento se categoriza con la categoría/subcategoría de esa asociación

#### Escenario: Ninguna asociación coincide
- Dado que ninguna asociación por descripción coincide con la descripción del movimiento
- Cuando se importa ese movimiento del PDF
- Entonces el movimiento se categoriza como "Sin categorizar"

### Requirement: Reconocimiento de cuenta con formato de número distinto

Al importar un PDF, si ya existe una cuenta bancaria cuyo número de cuenta
coincide en dígitos con el del PDF (ignorando el agrupamiento de espacios,
que puede diferir entre el Excel y el PDF del mismo banco), el sistema DEBE
reutilizar esa cuenta existente en vez de crear una duplicada.

#### Escenario: Mismo CCC, distinto agrupamiento de espacios
- Dado que existe una cuenta con número "1465 0100 9617 05727894"
- Cuando se importa un PDF cuya cabecera indica el número "1465 0100 96 1705727894" (mismos dígitos, agrupados de otra forma)
- Entonces los movimientos se asocian a la cuenta ya existente, sin crear una nueva

## MODIFIED Requirements

### Requirement: Deduplicación de movimientos

El sistema DEBE considerar que un movimiento ya existe si coinciden cuenta,
fecha de valor, importe, saldo y descripción (comparando la descripción con
los espacios internos colapsados, para tolerar que dos exportaciones del
mismo extracto bancario formateen el espaciado de forma distinta), y en ese
caso DEBE omitirlo sin crear un duplicado ni modificar el existente.
(Anteriormente: la descripción se comparaba de forma literal, sin colapsar
espacios.)

#### Escenario: Reimportar el mismo fichero
- Dado que un fichero ya fue importado completamente
- Cuando se importa el mismo fichero de nuevo
- Entonces ningún movimiento se duplica y todos se reportan como omitidos

#### Escenario: Misma descripción con distinto espaciado interno
- Dado que existe un movimiento con descripción "Recibo C.P. C CASTILLA REAL"
- Cuando se importa un movimiento idéntico en cuenta, fecha, importe y saldo, pero con descripción "Recibo C.P. C  CASTILLA REAL" (doble espacio)
- Entonces el sistema lo reconoce como el mismo movimiento y lo omite por duplicado
