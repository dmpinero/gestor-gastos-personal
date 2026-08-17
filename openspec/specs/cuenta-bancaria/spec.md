# Especificación: Cuenta Bancaria

## Propósito

Representar las cuentas bancarias sobre las que se registran movimientos, y
permitir su gestión completa desde la interfaz.

## Requisitos

### Requisito: Alta de cuenta bancaria

El sistema DEBE permitir crear una cuenta bancaria con número de cuenta
(obligatorio y único), alias, entidad bancaria, moneda y titular (los cuatro
últimos opcionales).

#### Escenario: Alta correcta
- Dado que no existe ninguna cuenta con número "1465 0100 9117 09489330"
- Cuando se crea una cuenta bancaria con ese número de cuenta
- Entonces la cuenta se guarda y aparece en el listado de cuentas

#### Escenario: Número de cuenta duplicado
- Dado que ya existe una cuenta con número "1465 0100 9117 09489330"
- Cuando se intenta crear otra cuenta con el mismo número
- Entonces el sistema rechaza la operación y no crea una segunda cuenta

### Requisito: Edición de cuenta bancaria

El sistema DEBE permitir editar el alias, la entidad bancaria, la moneda y el
titular de una cuenta existente. El número de cuenta NO DEBE poder editarse
una vez creada la cuenta.

#### Escenario: Editar alias
- Dado que existe una cuenta bancaria
- Cuando se actualiza su alias a "Cuenta nómina"
- Entonces el listado de cuentas refleja el nuevo alias

### Requisito: Baja de cuenta bancaria

El sistema DEBE impedir eliminar una cuenta bancaria que tenga movimientos
asociados, para no perder histórico de forma accidental.

#### Escenario: Baja sin movimientos
- Dado que existe una cuenta bancaria sin movimientos asociados
- Cuando se elimina esa cuenta
- Entonces la cuenta deja de aparecer en el listado

#### Escenario: Baja bloqueada por movimientos existentes
- Dado que existe una cuenta bancaria con al menos un movimiento asociado
- Cuando se intenta eliminar esa cuenta
- Entonces el sistema rechaza la eliminación e informa del motivo

### Requisito: Listado de cuentas

El sistema DEBE permitir consultar el listado completo de cuentas bancarias
dadas de alta.

#### Escenario: Listado vacío
- Dado que no hay ninguna cuenta bancaria creada
- Cuando se consulta el listado de cuentas
- Entonces se devuelve una lista vacía, no un error
