# Especificación: Movimiento

## Propósito

Registrar cada movimiento económico de una cuenta bancaria (cargo o abono),
con su categorización, y permitir su gestión manual desde la interfaz además
de la importación masiva.

## Requisitos

### Requisito: Alta manual de movimiento

El sistema DEBE permitir crear un movimiento indicando cuenta bancaria
(obligatoria), categoría (obligatoria), subcategoría (opcional), fecha de
valor (obligatoria), descripción (obligatoria), comentario (opcional),
importe (obligatorio, decimal, puede ser negativo o positivo) y saldo
(obligatorio, decimal).

#### Escenario: Alta correcta de un cargo
- Dado que existen la cuenta "Cuenta nómina" y la categoría "Alimentación"
- Cuando se crea un movimiento en esa cuenta con importe -20.31 y saldo 3636.54
- Entonces el movimiento aparece en el listado de movimientos de esa cuenta

#### Escenario: Alta correcta de un abono
- Dado que existen la cuenta "Cuenta nómina" y la categoría "Otros ingresos"
- Cuando se crea un movimiento con importe positivo
- Entonces el movimiento se guarda igual que un cargo, sin restricción de signo

#### Escenario: Falta un campo obligatorio
- Dado que se va a crear un movimiento sin descripción
- Cuando se envía la creación
- Entonces el sistema rechaza la operación e indica el campo obligatorio que falta

### Requisito: Edición de movimiento

El sistema DEBE permitir editar cualquier campo de un movimiento existente
(cuenta, categoría, subcategoría, fecha, descripción, comentario, importe,
saldo).

#### Escenario: Corregir la categoría de un movimiento
- Dado que existe un movimiento con categoría "Otros gastos"
- Cuando se edita para asignarle la categoría "Alimentación"
- Entonces el movimiento queda clasificado bajo "Alimentación"

### Requisito: Baja de movimiento

El sistema DEBE permitir eliminar un movimiento existente sin restricciones
adicionales (un movimiento no tiene entidades hijas).

#### Escenario: Baja correcta
- Dado que existe un movimiento
- Cuando se elimina
- Entonces deja de aparecer en el listado de movimientos

### Requisito: Marca de origen del movimiento

Cuando un movimiento se crea mediante la importación de un certificado en
PDF, el sistema DEBE marcarlo con un origen ("pdf") y DEBE mostrar un
indicador visual junto a su descripción en los listados de movimientos e
historial, para poder localizarlo y revisar la categoría/subcategoría que se
le asignó automáticamente. Un movimiento creado a mano o importado desde
Excel NO DEBE llevar esta marca. Editar un movimiento NO DEBE alterar su
marca de origen.

#### Escenario: Movimiento importado desde PDF muestra el indicador
- Dado que se importa un certificado de movimientos en PDF
- Cuando se consulta el listado de movimientos de esa cuenta
- Entonces cada movimiento importado desde ese PDF muestra el indicador de origen PDF

#### Escenario: Movimiento importado desde Excel no muestra el indicador
- Dado que se importa un extracto de movimientos en Excel
- Cuando se consulta el listado de movimientos de esa cuenta
- Entonces ninguno de esos movimientos muestra el indicador de origen PDF

#### Escenario: Editar un movimiento con origen PDF conserva la marca
- Dado que existe un movimiento importado desde PDF
- Cuando se edita su categoría
- Entonces el movimiento sigue mostrando el indicador de origen PDF

### Requisito: Listado de movimientos

El sistema DEBE permitir consultar los movimientos de una cuenta, ordenados
por fecha de valor de más reciente a más antiguo.

#### Escenario: Listado ordenado
- Dado que una cuenta tiene movimientos en varias fechas
- Cuando se consulta su listado de movimientos
- Entonces se devuelven ordenados de la fecha más reciente a la más antigua
