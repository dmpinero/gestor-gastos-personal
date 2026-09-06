# Delta for Movimiento

## ADDED Requirements

### Requirement: Filtrar movimientos por origen PDF

En la vista de gestión de movimientos, el sistema DEBE ofrecer un filtro que,
al activarse, DEBE restringir el listado a los movimientos con origen "pdf".
El filtro DEBE combinarse con el resto de filtros avanzados activos (fecha,
importe, saldo, categoría, subcategoría, texto libre) y DEBE resetearse al
pulsar "Limpiar filtros".

#### Scenario: Activar el filtro oculta los movimientos sin origen PDF

- GIVEN una cuenta con movimientos creados a mano y movimientos importados desde PDF
- WHEN se marca la casilla "Solo importados desde PDF"
- THEN el listado muestra únicamente los movimientos con origen PDF
- AND los movimientos creados a mano dejan de aparecer

#### Scenario: Limpiar filtros restaura el listado completo

- GIVEN el filtro "Solo importados desde PDF" está activo y oculta movimientos
- WHEN se pulsa "Limpiar filtros"
- THEN vuelven a aparecer todos los movimientos de la cuenta, con origen PDF o sin él
