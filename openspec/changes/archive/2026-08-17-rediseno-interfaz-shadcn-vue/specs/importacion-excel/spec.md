# Delta for Importación de movimientos desde Excel

## ADDED Requirements

### Requirement: Carga de fichero por arrastrar y soltar

El sistema DEBE permitir seleccionar el fichero Excel a importar arrastrándolo y
soltándolo sobre una zona designada de la interfaz, como alternativa a seleccionarlo
mediante el diálogo de selección de fichero del sistema operativo (click). Ambas vías
DEBEN dar lugar al mismo comportamiento de importación una vez el fichero está
seleccionado.

#### Scenario: Soltar un fichero válido sobre la zona de carga
- GIVEN que el usuario está en la vista de importación con la zona de arrastre visible
- WHEN arrastra un fichero ".xlsx" válido y lo suelta sobre esa zona
- THEN el fichero queda seleccionado para importar, igual que si se hubiera elegido
  por click

#### Scenario: Soltar un fichero con extensión no soportada
- GIVEN que el usuario está en la vista de importación
- WHEN arrastra un fichero ".csv" y lo suelta sobre la zona de carga
- THEN el sistema aplica el mismo rechazo por extensión no soportada que ya aplica
  cuando el fichero se selecciona por click

#### Scenario: Seleccionar el fichero por click sigue disponible
- GIVEN que el usuario está en la vista de importación
- WHEN hace click sobre la zona de carga en vez de arrastrar un fichero
- THEN se abre el selector de fichero del sistema operativo, igual que antes de
  añadir el arrastrar y soltar
