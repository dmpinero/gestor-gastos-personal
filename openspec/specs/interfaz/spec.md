# Especificación: Interfaz de usuario (navegación, tema y confirmaciones)

## Propósito

Definir el comportamiento del panel de navegación, la navegación por pestañas dentro
de la gestión de datos, el panel deslizante de creación/edición, la selección
múltiple, la preferencia de tema visual (claro/oscuro), la confirmación previa a
operaciones destructivas, y la barra de estado, comunes a todas las vistas de la
aplicación.

## Requisitos

### Requisito: Panel de navegación lateral colapsable

El sistema DEBE mostrar un panel de navegación fijo en el lado derecho de la
pantalla con acceso a las secciones Inicio y Gestión. El panel DEBE poder
colapsarse mediante un control a una franja que muestra solo los iconos de
cada sección, sin ocultarse por completo, y DEBE poder expandirse de nuevo
mostrando icono y texto.

#### Escenario: Colapsar el panel
- Dado que el panel de navegación está expandido (icono y texto visibles)
- Cuando el usuario pulsa el control de colapsar
- Entonces el panel queda reducido a una franja que muestra solo los iconos

#### Escenario: Expandir el panel
- Dado que el panel de navegación está colapsado (solo iconos)
- Cuando el usuario pulsa el control de expandir
- Entonces el panel vuelve a mostrar icono y texto de cada sección

#### Escenario: Resaltado de la sección activa
- Dado que el usuario está en la vista de Gestión (cualquiera de sus pestañas)
- Cuando se muestra el panel de navegación
- Entonces la sección "Gestión" aparece marcada como activa y "Inicio" no

### Requisito: Navegación por pestañas dentro de Gestión

El sistema DEBE agrupar la gestión de Cuentas, Categorías, Movimientos e
Importación en una única vista con pestañas, en vez de secciones
independientes del menú lateral. Cada pestaña DEBE cargar y mostrar los datos
reales de su sección al activarse.

#### Escenario: Cambiar de pestaña muestra datos reales
- Dado que el usuario está en la vista de Gestión con la pestaña "Cuentas" activa
- Cuando pulsa la pestaña "Movimientos"
- Entonces se muestra el contenido de Movimientos con los datos ya cargados desde el servidor

#### Escenario: La pestaña activa se refleja en la URL
- Dado que el usuario está en la vista de Gestión
- Cuando pulsa la pestaña "Categorías"
- Entonces la URL cambia para reflejar esa pestaña y recargar la página mantiene esa misma pestaña activa

### Requisito: Panel deslizante de creación y edición

El sistema DEBE mostrar el formulario de creación o edición de una cuenta
bancaria, un movimiento o una categoría en un panel deslizante desde el borde
derecho de la pantalla, en vez de un formulario permanentemente visible. El
panel DEBE poder cerrarse sin guardar cambios.

#### Escenario: Crear un elemento abre el panel vacío
- Dado que el usuario está en el listado de Cuentas
- Cuando pulsa "Crear cuenta"
- Entonces se abre el panel deslizante con el formulario vacío

#### Escenario: Editar un elemento abre el panel relleno
- Dado que existe una cuenta en el listado
- Cuando el usuario pulsa "Editar" sobre esa fila
- Entonces se abre el panel deslizante con el formulario relleno con los datos de esa cuenta

#### Escenario: Cerrar el panel sin guardar no modifica nada
- Dado que el panel de creación o edición está abierto con cambios sin guardar
- Cuando el usuario lo cierra sin pulsar "Crear"/"Guardar cambios"
- Entonces no se envía ninguna petición y el listado permanece igual

### Requisito: Selección múltiple y eliminación en bloque

El sistema DEBE permitir seleccionar varias filas en las tablas de Cuentas y
Movimientos mediante casillas de selección, incluyendo una casilla para
seleccionar todas las filas visibles. Con al menos una fila seleccionada, DEBE
ofrecer una acción para eliminar todas las filas seleccionadas de una vez,
pidiendo confirmación como en la eliminación individual.

#### Escenario: Seleccionar todas las filas
- Dado una tabla con varias filas
- Cuando el usuario marca la casilla de la cabecera
- Entonces todas las filas quedan marcadas como seleccionadas

#### Escenario: Eliminar en bloque tras confirmar
- Dado 3 filas seleccionadas
- Cuando el usuario pulsa "Eliminar seleccionados" y confirma en el diálogo
- Entonces las 3 filas se eliminan y desaparecen del listado

#### Escenario: Cancelar la eliminación en bloque
- Dado filas seleccionadas
- Cuando el usuario pulsa "Eliminar seleccionados" y cancela en el diálogo
- Entonces ninguna fila se elimina y la selección se mantiene

### Requisito: Preferencia de tema claro/oscuro

El sistema DEBE ofrecer un control para alternar entre tema claro y oscuro. En la
primera visita, sin preferencia guardada, DEBE aplicar el tema que indique la
preferencia del sistema operativo del usuario. Al cambiar el tema manualmente, DEBE
persistir la elección para que se respete en visitas posteriores, incluso si difiere
de la preferencia del sistema operativo.

#### Escenario: Primera visita sin preferencia guardada
- Dado que el usuario nunca ha visitado la aplicación y su sistema operativo tiene
  activado el modo oscuro
- Cuando carga la aplicación por primera vez
- Entonces la aplicación se muestra en tema oscuro

#### Escenario: Cambio manual de tema se conserva
- Dado que el usuario tiene el tema claro activo
- Cuando pulsa el control para cambiar a tema oscuro
- Entonces la aplicación pasa a mostrarse en tema oscuro
- Y al recargar la página, sigue mostrándose en tema oscuro aunque el sistema
  operativo tenga configurado el tema claro

### Requisito: Confirmación antes de eliminar

El sistema DEBE solicitar confirmación explícita en un diálogo antes de eliminar
cualquier cuenta bancaria, categoría, subcategoría o movimiento. Si el usuario cancela,
NO DEBE eliminarse el registro. Si el usuario confirma, DEBE eliminarse como hasta
ahora.

#### Escenario: Cancelar la eliminación
- Dado que el usuario pulsa "Eliminar" sobre un registro existente
- Cuando en el diálogo de confirmación pulsa "Cancelar"
- Entonces el registro sigue existiendo y no se envía ninguna petición de borrado

#### Escenario: Confirmar la eliminación
- Dado que el usuario pulsa "Eliminar" sobre un registro existente
- Cuando en el diálogo de confirmación pulsa "Eliminar"
- Entonces el registro se elimina y desaparece del listado

### Requisito: Barra de estado con versión y changelog

El sistema DEBE mostrar una barra de estado fija en la parte inferior,
visible en todas las vistas, con el número de versión de la aplicación y un
control para abrir el historial de cambios. El control DEBE abrir una modal
con el contenido del changelog del proyecto.

#### Escenario: La barra de estado es visible en cualquier vista
- Dado que el usuario navega a cualquier vista de la aplicación
- Cuando la página termina de cargar
- Entonces la barra de estado con la versión es visible en la parte inferior

#### Escenario: Abrir el historial de cambios
- Dado que la barra de estado es visible
- Cuando el usuario pulsa el control de historial de cambios
- Entonces se abre una modal mostrando el contenido del changelog del proyecto
