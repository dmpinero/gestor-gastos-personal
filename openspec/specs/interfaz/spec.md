# Especificación: Interfaz de usuario (navegación, tema y confirmaciones)

## Propósito

Definir el comportamiento del panel de navegación, la preferencia de tema visual
(claro/oscuro) y la confirmación previa a operaciones destructivas, comunes a todas
las vistas de la aplicación.

## Requisitos

### Requisito: Panel de navegación lateral colapsable

El sistema DEBE mostrar un panel de navegación fijo en el lado derecho de la pantalla
con acceso a las secciones Inicio, Cuentas, Categorías, Movimientos e Importar. El
panel DEBE poder colapsarse mediante un control a una franja que muestra solo los
iconos de cada sección, sin ocultarse por completo, y DEBE poder expandirse de nuevo
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
- Dado que el usuario está en la vista de Movimientos
- Cuando se muestra el panel de navegación
- Entonces la sección "Movimientos" aparece marcada como activa y las demás no

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
