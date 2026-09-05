# Delta for Movimiento

## ADDED Requirements

### Requirement: Marca de origen del movimiento

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
