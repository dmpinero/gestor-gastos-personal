# Especificación: Importación de movimientos desde Excel

## Propósito

Permitir cargar en bloque los movimientos de un extracto bancario exportado
en Excel (.xls/.xlsx), sin introducirlos manualmente uno a uno.

## Requisitos

### Requisito: Subida del fichero

El sistema DEBE permitir subir un fichero Excel (.xls o .xlsx) desde la
interfaz para iniciar una importación.

#### Escenario: Extensión no soportada
- Dado que se sube un fichero con extensión ".csv"
- Cuando se envía para importar
- Entonces el sistema rechaza el fichero e indica que solo admite .xls/.xlsx

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

### Requisito: Localización tolerante de la fila de columnas

El sistema DEBE localizar la fila de cabecera de columnas (fecha de valor,
categoría, subcategoría, descripción, comentario, importe, saldo) buscando
esos nombres de columna, sin asumir una posición fija de fila, para tolerar
pequeños cambios de formato entre exportaciones.

#### Escenario: Cabecera no encontrada
- Dado un fichero Excel que no contiene ninguna fila con esos nombres de columna
- Cuando se intenta importar
- Entonces el sistema rechaza el fichero e informa de que no reconoce su formato

### Requisito: Alta automática de categorías y subcategorías

Por cada fila de movimiento, el sistema DEBE crear automáticamente la
categoría y/o subcategoría indicadas si todavía no existen.

#### Escenario: Categoría nueva detectada
- Dado que la categoría "Educación y salud" no existe todavía
- Cuando se importa una fila con esa categoría
- Entonces se crea la categoría y el movimiento queda asociado a ella

### Requisito: Deduplicación de movimientos

El sistema DEBE considerar que un movimiento ya existe si coinciden cuenta,
fecha de valor, importe, saldo y descripción exactos, y en ese caso DEBE
omitirlo sin crear un duplicado ni modificar el existente.

#### Escenario: Reimportar el mismo fichero
- Dado que un fichero ya fue importado completamente
- Cuando se importa el mismo fichero de nuevo
- Entonces ningún movimiento se duplica y todos se reportan como omitidos

### Requisito: Resumen de la importación

Al finalizar, el sistema DEBE devolver un resumen con el número de
movimientos importados, el número omitidos por duplicado, y las categorías y
subcategorías nuevas creadas durante esa importación.

#### Escenario: Resumen tras importación mixta
- Dado un fichero con algunos movimientos nuevos y otros ya existentes
- Cuando se importa
- Entonces el resumen indica correctamente cuántos se importaron y cuántos se omitieron

### Requisito: Fichero sin movimientos

El sistema DEBE rechazar como error un fichero cuya fila de cabecera de
columnas se localiza correctamente pero no contiene ninguna fila de
movimiento por debajo.

#### Escenario: Fichero vacío de movimientos
- Dado un fichero con la cabecera de columnas pero sin filas de datos
- Cuando se intenta importar
- Entonces el sistema informa de que no hay movimientos que importar
