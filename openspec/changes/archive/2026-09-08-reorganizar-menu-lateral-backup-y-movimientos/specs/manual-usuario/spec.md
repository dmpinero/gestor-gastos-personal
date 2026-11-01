# Delta for manual-usuario

## MODIFIED Requirements

### Requirement: Recorrido de las secciones principales

Al lanzarse desde una página, el tour DEBE empezar con un único paso de
orientación que resalta, en el menú lateral, la sección a la que pertenece
esa página, mostrando una explicación breve de su propósito. A continuación
DEBE recorrer los pasos específicos de la funcionalidad de esa página (si
la página tiene tour registrado). El tour NO DEBE recorrer las secciones del
menú distintas de la activa. El tour SIEMPRE DEBE terminar con un paso para
el conmutador de tema y un paso para el propio icono de ayuda.

(Previamente: el escenario de ejemplo usaba "Gestión → Movimientos", ya que
Movimientos era una sub-pestaña de Gestión. Con Movimientos como sección de
menú independiente, el escenario pasa a resaltar "Movimientos" en vez de
"Gestión".)

#### Scenario: Lanzar el tour desde Movimientos recorre Movimientos, no las demás secciones

- Dado que la persona usuaria está en Movimientos
- Cuando pulsa el icono de ayuda
- Entonces el primer paso resalta la sección "Movimientos" del menú lateral, los siguientes pasos recorren la funcionalidad propia de Movimientos, ningún paso resalta las demás secciones, y el tour termina con el conmutador de tema y el icono de ayuda

### Requirement: Tours de las páginas de Backup

Cada una de las 2 sub-páginas de Backup (Realizar backup, Importar backup)
DEBE tener su propio tour, independiente de la otra, sin navegar
automáticamente entre ellas. El tour de Importar backup DEBE advertir en su
texto de que es una acción destructiva que sustituye todos los datos.

(Previamente: "Tours de las páginas de Administración", con 3 sub-páginas
incluyendo Gestión de conceptos. Ese tour se traslada al nuevo requisito
"Tour de Asociar conceptos dentro de Gestión".)

#### Scenario: El tour de Importar backup advierte del riesgo

- Dado que la persona usuaria está en Backup → Importar backup
- Cuando pulsa el icono de ayuda
- Entonces el paso correspondiente menciona que la importación sustituye toda la información actual

## ADDED Requirements

### Requirement: Tour de Asociar conceptos dentro de Gestión

El tour de la sub-página "Asociar conceptos" (antes "Gestión de conceptos")
DEBE recorrer el formulario de asociación por categoría, el de asociación
por descripción, el botón de crear asociación, y las tablas de asociaciones
ya creadas. El paso de orientación DEBE resaltar la sección "Gestión" del
menú lateral.

#### Scenario: El tour de Asociar conceptos recorre sus formularios y tablas

- Dado que la persona usuaria está en Gestión → Asociar conceptos
- Cuando pulsa el icono de ayuda
- Entonces el primer paso resalta la sección "Gestión" del menú lateral, y los siguientes pasos recorren el formulario de asociación por categoría, el de asociación por descripción, el botón de crear asociación, y las tablas de asociaciones ya creadas

### Requirement: Acceso directo a Asociar conceptos desde Resumen anual

Dado que los conceptos previstos se crean en Resumen anual pero se asocian
a categorías reales en Gestión, la página Resumen anual DEBE ofrecer un
acceso directo a "Asociar conceptos" (Gestión), como primer paso de su
tour guiado, además del ya existente en el menú lateral.

#### Scenario: El tour de Resumen anual incluye el acceso a Asociar conceptos

- Dado que la persona usuaria está en Resumen anual
- Cuando pulsa el icono de ayuda
- Entonces el primer paso tras la orientación resalta el acceso directo a Asociar conceptos, antes de los pasos de importar/exportar Excel

### Requirement: Movimientos como sección de menú independiente

El sistema DEBE mostrar "Movimientos" como ítem de menú de primer nivel, no
como sub-pestaña de Gestión, posicionado inmediatamente debajo de Dashboard
en el menú lateral.

#### Scenario: Movimientos aparece como sección propia bajo Dashboard

- Dado que la persona usuaria abre el menú lateral
- Cuando observa el orden de las secciones
- Entonces "Movimientos" aparece como sección de primer nivel justo debajo de "Dashboard"

### Requirement: Backup como sección renombrada

La sección de menú antes llamada "Administración" DEBE llamarse "Backup" y
DEBE seguir siendo la última sección del menú lateral. La sección "Gestión"
DEBE aparecer inmediatamente encima de "Backup".

#### Scenario: Backup es la última sección, con Gestión justo encima

- Dado que la persona usuaria abre el menú lateral
- Cuando observa el orden de las secciones
- Entonces "Backup" es la última sección y "Gestión" es la sección inmediatamente anterior a ella

### Requirement: Agrupación visual del menú lateral

El menú lateral DEBE separar visualmente, con una etiqueta de grupo, las
secciones de uso diario (Dashboard, Movimientos, Importar, Historial,
Resumen anual) de las secciones de configuración/mantenimiento ocasional
(Gestión, Backup), sin añadir ningún nivel de clic adicional.

#### Scenario: El menú lateral muestra dos grupos etiquetados

- Dado que la persona usuaria abre el menú lateral
- Cuando observa su estructura
- Entonces ve un grupo "General" con Dashboard, Movimientos, Importar, Historial y Resumen anual, y un grupo "Configuración" con Gestión y Backup, sin que eso cambie el número de clics para llegar a cada sección
