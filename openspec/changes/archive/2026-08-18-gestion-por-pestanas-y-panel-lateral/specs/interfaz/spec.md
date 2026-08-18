# Delta for Interfaz de usuario (navegación, tema y confirmaciones)

## MODIFIED Requirements

### Requirement: Panel de navegación lateral colapsable

El sistema DEBE mostrar un panel de navegación fijo en el lado derecho de la
pantalla con acceso a las secciones Inicio y Gestión. El panel DEBE poder
colapsarse mediante un control a una franja que muestra solo los iconos de
cada sección, sin ocultarse por completo, y DEBE poder expandirse de nuevo
mostrando icono y texto.
(Previamente: el panel tenía 5 secciones — Inicio, Cuentas, Categorías,
Movimientos e Importar — en vez de las 2 actuales, Inicio y Gestión.)

#### Scenario: Colapsar el panel
- GIVEN que el panel de navegación está expandido (icono y texto visibles)
- WHEN el usuario pulsa el control de colapsar
- THEN el panel queda reducido a una franja que muestra solo los iconos

#### Scenario: Expandir el panel
- GIVEN que el panel de navegación está colapsado (solo iconos)
- WHEN el usuario pulsa el control de expandir
- THEN el panel vuelve a mostrar icono y texto de cada sección

#### Scenario: Resaltado de la sección activa
- GIVEN que el usuario está en la vista de Gestión (cualquiera de sus pestañas)
- WHEN se muestra el panel de navegación
- THEN la sección "Gestión" aparece marcada como activa y "Inicio" no

## ADDED Requirements

### Requirement: Navegación por pestañas dentro de Gestión

El sistema DEBE agrupar la gestión de Cuentas, Categorías, Movimientos e
Importación en una única vista con pestañas, en vez de secciones
independientes del menú lateral. Cada pestaña DEBE cargar y mostrar los datos
reales de su sección al activarse.

#### Scenario: Cambiar de pestaña muestra datos reales
- GIVEN que el usuario está en la vista de Gestión con la pestaña "Cuentas" activa
- WHEN pulsa la pestaña "Movimientos"
- THEN se muestra el contenido de Movimientos con los datos ya cargados desde el servidor

#### Scenario: La pestaña activa se refleja en la URL
- GIVEN que el usuario está en la vista de Gestión
- WHEN pulsa la pestaña "Categorías"
- THEN la URL cambia para reflejar esa pestaña y recargar la página mantiene esa misma pestaña activa

### Requirement: Panel deslizante de creación y edición

El sistema DEBE mostrar el formulario de creación o edición de una cuenta
bancaria, un movimiento o una categoría en un panel deslizante desde el borde
derecho de la pantalla, en vez de un formulario permanentemente visible. El
panel DEBE poder cerrarse sin guardar cambios.

#### Scenario: Crear un elemento abre el panel vacío
- GIVEN que el usuario está en el listado de Cuentas
- WHEN pulsa "Crear cuenta"
- THEN se abre el panel deslizante con el formulario vacío

#### Scenario: Editar un elemento abre el panel relleno
- GIVEN que existe una cuenta en el listado
- WHEN el usuario pulsa "Editar" sobre esa fila
- THEN se abre el panel deslizante con el formulario relleno con los datos de esa cuenta

#### Scenario: Cerrar el panel sin guardar no modifica nada
- GIVEN que el panel de creación o edición está abierto con cambios sin guardar
- WHEN el usuario lo cierra sin pulsar "Crear"/"Guardar cambios"
- THEN no se envía ninguna petición y el listado permanece igual

### Requirement: Selección múltiple y eliminación en bloque

El sistema DEBE permitir seleccionar varias filas en las tablas de Cuentas y
Movimientos mediante casillas de selección, incluyendo una casilla para
seleccionar todas las filas visibles. Con al menos una fila seleccionada, DEBE
ofrecer una acción para eliminar todas las filas seleccionadas de una vez,
pidiendo confirmación como en la eliminación individual.

#### Scenario: Seleccionar todas las filas
- GIVEN una tabla con varias filas
- WHEN el usuario marca la casilla de la cabecera
- THEN todas las filas quedan marcadas como seleccionadas

#### Scenario: Eliminar en bloque tras confirmar
- GIVEN 3 filas seleccionadas
- WHEN el usuario pulsa "Eliminar seleccionados" y confirma en el diálogo
- THEN las 3 filas se eliminan y desaparecen del listado

#### Scenario: Cancelar la eliminación en bloque
- GIVEN filas seleccionadas
- WHEN el usuario pulsa "Eliminar seleccionados" y cancela en el diálogo
- THEN ninguna fila se elimina y la selección se mantiene

### Requirement: Barra de estado con versión y changelog

El sistema DEBE mostrar una barra de estado fija en la parte inferior,
visible en todas las vistas, con el número de versión de la aplicación y un
control para abrir el historial de cambios. El control DEBE abrir una modal
con el contenido del changelog del proyecto.

#### Scenario: La barra de estado es visible en cualquier vista
- GIVEN que el usuario navega a cualquier vista de la aplicación
- WHEN la página termina de cargar
- THEN la barra de estado con la versión es visible en la parte inferior

#### Scenario: Abrir el historial de cambios
- GIVEN que la barra de estado es visible
- WHEN el usuario pulsa el control de historial de cambios
- THEN se abre una modal mostrando el contenido del changelog del proyecto
