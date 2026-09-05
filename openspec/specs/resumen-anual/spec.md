# Especificación: Resumen anual

## Propósito

Documentar, de momento, únicamente el límite de rango de años al exportar el
resumen anual a Excel, corregido en esta sesión. No reemplaza ni documenta el
resto de funcionalidad de Resumen anual (conceptos previstos, carga de
importe real, ajustes manuales) ya existente antes de este cambio y sin spec
previa.

## Requisitos

### Requisito: Rango de años limitado al exportar

El sistema DEBE limitar el rango de años exportable (`anio_desde`,
`anio_hasta`) a un mínimo de 2018 y un máximo de un año por encima del año en
curso, y DEBE rechazar con un error cualquier valor fuera de ese rango. Un
rango sin límite práctico hace que la exportación itere y consulte un año por
cada valor del rango, con un coste de rendimiento no acotado.

#### Escenario: Rango dentro de lo permitido
- Cuando se exporta el resumen anual con `anio_desde=2018` y `anio_hasta` igual al año en curso
- Entonces la exportación se genera correctamente

#### Escenario: Año anterior al mínimo permitido
- Cuando se exporta el resumen anual con `anio_desde` anterior a 2018
- Entonces el sistema rechaza la petición

#### Escenario: Año posterior al máximo permitido
- Cuando se exporta el resumen anual con `anio_hasta` más de un año por encima del año en curso
- Entonces el sistema rechaza la petición

#### Escenario: Planificación del año siguiente
- Cuando se exporta el resumen anual con `anio_hasta` igual al año siguiente al año en curso
- Entonces la exportación se genera correctamente, permitiendo planificar el presupuesto del año siguiente
