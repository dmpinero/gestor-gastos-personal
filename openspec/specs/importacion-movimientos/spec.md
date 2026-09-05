# Especificación: Importación de movimientos

## Propósito

Permitir cargar en bloque los movimientos de un extracto bancario, sin
introducirlos manualmente uno a uno. Admite dos formatos de origen: Excel
(.xls/.xlsx, con categoría/subcategoría explícitas) y certificado de
movimientos en PDF (sin categoría/subcategoría, autocategorizado por
asociación de descripción).

## Requisitos

### Requisito: Subida del fichero

El sistema DEBE permitir subir un fichero Excel (.xls o .xlsx) o un
certificado de movimientos en PDF desde la misma zona de subida de la
interfaz para iniciar una importación, sin necesitar secciones separadas por
formato.

#### Escenario: Extensión no soportada
- Dado que se sube un fichero con extensión ".csv"
- Cuando se envía para importar
- Entonces el sistema rechaza el fichero e indica que solo admite .xls/.xlsx/.pdf

#### Escenario: PDF válido
- Dado un certificado de movimientos en PDF con el formato esperado (ING: fecha, concepto, importe, saldo)
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

### Requisito: Extracción de cuenta desde la cabecera

El sistema DEBE leer de la cabecera del fichero el número de cuenta y el
titular. Si ya existe una cuenta bancaria con ese número, DEBE reutilizarla;
si no existe, DEBE crearla.

#### Escenario: Cuenta nueva
- Dado que no existe ninguna cuenta con el número indicado en la cabecera del fichero
- Cuando se importa el fichero
- Entonces se crea una nueva cuenta bancaria con ese número y ese titular

#### Escenario: Cuenta ya existente
- Dado que ya existe una cuenta bancaria con el número indicado en la cabecera
- Cuando se importa el fichero
- Entonces los movimientos se asocian a la cuenta existente sin duplicarla

#### Escenario: Mismo CCC, distinto agrupamiento de espacios (PDF)
- Dado que existe una cuenta con número "1465 0100 9617 05727894"
- Cuando se importa un PDF cuya cabecera indica el número "1465 0100 96 1705727894" (mismos dígitos, agrupados de otra forma)
- Entonces los movimientos se asocian a la cuenta ya existente, sin crear una nueva

### Requisito: Localización tolerante de la fila de columnas (Excel)

El sistema DEBE localizar la fila de cabecera de columnas (fecha de valor,
categoría, subcategoría, descripción, comentario, importe, saldo) buscando
esos nombres de columna, sin asumir una posición fija de fila, para tolerar
pequeños cambios de formato entre exportaciones.

#### Escenario: Cabecera no encontrada
- Dado un fichero Excel que no contiene ninguna fila con esos nombres de columna
- Cuando se intenta importar
- Entonces el sistema rechaza el fichero e informa de que no reconoce su formato

### Requisito: Alta automática de categorías y subcategorías (Excel)

Por cada fila de movimiento de un Excel, el sistema DEBE crear
automáticamente la categoría y/o subcategoría indicadas si todavía no
existen.

#### Escenario: Categoría nueva detectada
- Dado que la categoría "Educación y salud" no existe todavía
- Cuando se importa una fila de Excel con esa categoría
- Entonces se crea la categoría y el movimiento queda asociado a ella

### Requisito: Autocategorización de movimientos importados desde PDF

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

### Requisito: Deduplicación de movimientos

El sistema DEBE considerar que un movimiento ya existe si coinciden cuenta,
fecha de valor, importe, saldo y descripción (comparando la descripción con
los espacios internos colapsados, para tolerar que dos exportaciones del
mismo extracto bancario formateen el espaciado de forma distinta), y en ese
caso DEBE omitirlo sin crear un duplicado ni modificar el existente.

#### Escenario: Reimportar el mismo fichero
- Dado que un fichero ya fue importado completamente
- Cuando se importa el mismo fichero de nuevo
- Entonces ningún movimiento se duplica y todos se reportan como omitidos

#### Escenario: Misma descripción con distinto espaciado interno
- Dado que existe un movimiento con descripción "Recibo C.P. C CASTILLA REAL"
- Cuando se importa un movimiento idéntico en cuenta, fecha, importe y saldo, pero con descripción "Recibo C.P. C  CASTILLA REAL" (doble espacio)
- Entonces el sistema lo reconoce como el mismo movimiento y lo omite por duplicado

### Requisito: Resumen de la importación

Al finalizar, el sistema DEBE devolver un resumen con el número de
movimientos importados, el número omitidos por duplicado, y las categorías y
subcategorías nuevas creadas durante esa importación.

#### Escenario: Resumen tras importación mixta
- Dado un fichero con algunos movimientos nuevos y otros ya existentes
- Cuando se importa
- Entonces el resumen indica correctamente cuántos se importaron y cuántos se omitieron

### Requisito: Fichero sin movimientos (Excel)

El sistema DEBE rechazar como error un fichero cuya fila de cabecera de
columnas se localiza correctamente pero no contiene ninguna fila de
movimiento por debajo.

#### Escenario: Fichero vacío de movimientos
- Dado un fichero con la cabecera de columnas pero sin filas de datos
- Cuando se intenta importar
- Entonces el sistema informa de que no hay movimientos que importar

### Requisito: Carga de fichero por arrastrar y soltar

El sistema DEBE permitir seleccionar el fichero (Excel o PDF) a importar
arrastrándolo y soltándolo sobre una zona designada de la interfaz, como
alternativa a seleccionarlo mediante el diálogo de selección de fichero del
sistema operativo (click). Ambas vías DEBEN dar lugar al mismo comportamiento
de importación una vez el fichero está seleccionado.

#### Escenario: Soltar un fichero válido sobre la zona de carga
- Dado que el usuario está en la vista de importación con la zona de arrastre visible
- Cuando arrastra un fichero ".xlsx" válido y lo suelta sobre esa zona
- Entonces el fichero queda seleccionado para importar, igual que si se hubiera elegido por click

#### Escenario: Soltar un fichero con extensión no soportada
- Dado que el usuario está en la vista de importación
- Cuando arrastra un fichero ".csv" y lo suelta sobre la zona de carga
- Entonces el sistema aplica el mismo rechazo por extensión no soportada que ya aplica cuando el fichero se selecciona por click

#### Escenario: Seleccionar el fichero por click sigue disponible
- Dado que el usuario está en la vista de importación
- Cuando hace click sobre la zona de carga en vez de arrastrar un fichero
- Entonces se abre el selector de fichero del sistema operativo, igual que antes de añadir el arrastrar y soltar
