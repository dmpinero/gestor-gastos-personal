# Delta for Manual de usuario interactivo

## MODIFIED Requirements

### Requirement: Recorrido de las secciones principales

Al lanzarse desde una página, el tour DEBE empezar con un único paso de
orientación que resalta, en el menú lateral, la sección a la que pertenece
esa página, mostrando una explicación breve de su propósito. A continuación
DEBE recorrer los pasos específicos de la funcionalidad de esa página (si
la página tiene tour registrado). El tour NO DEBE recorrer las secciones del
menú distintas de la activa. El tour SIEMPRE DEBE terminar con un paso para
el conmutador de tema y un paso para el propio icono de ayuda.

(Anteriormente: el tour recorría siempre, sin importar la página, las 6
secciones del panel lateral en orden fijo, seguidas del conmutador de tema
y el icono de ayuda.)

#### Scenario: Lanzar el tour desde Movimientos recorre Movimientos, no las demás secciones

- GIVEN la persona usuaria está en Gestión → Movimientos
- WHEN pulsa el icono de ayuda
- THEN el primer paso resalta la sección "Gestión" del menú lateral
- AND los siguientes pasos recorren la funcionalidad propia de Movimientos (filtros, tabla, acciones)
- AND ningún paso resalta Dashboard, Importar, Historial, Resumen anual ni Administración
- AND el tour termina con el conmutador de tema y el icono de ayuda

#### Scenario: Lanzar el tour desde el Dashboard recorre sus tarjetas y bloques

- GIVEN la persona usuaria está en el Dashboard
- WHEN pulsa el icono de ayuda
- THEN los pasos recorren el saldo global, las tarjetas por cuenta, y los bloques de gastos e ingresos por categoría

## ADDED Requirements

### Requirement: Elementos condicionales forzados temporalmente durante el tour

Cuando un paso del tour corresponde a un control que solo es visible bajo
cierto estado local y reversible de la página (un filtro concreto, un modo
de vista, una fila seleccionada), el sistema DEBE ajustar ese estado antes
de mostrar el paso para que el control se resalte realmente, y DEBE
restaurar el estado que había antes de iniciar el tour al cerrarse este,
sea cual sea el motivo del cierre (botón cerrar, tecla Escape, o llegar al
último paso).

#### Scenario: "Mes anterior"/"Mes siguiente" se muestran durante el tour de Movimientos

- GIVEN la persona usuaria está en Movimientos con el filtro de fechas vacío
- WHEN el tour llega al paso de "Mes anterior"/"Mes siguiente"
- THEN esos botones son visibles y quedan resaltados
- AND al cerrar el tour, el filtro de fechas vuelve a estar vacío como antes de iniciarlo

#### Scenario: La barra de selección múltiple se muestra durante el tour

- GIVEN la persona usuaria está en Cuentas, Categorías o Movimientos sin ninguna fila seleccionada
- WHEN el tour llega al paso de la selección múltiple
- THEN la primera fila aparece marcada y la barra de acciones en bloque es visible
- AND al cerrar el tour, ninguna fila queda seleccionada

### Requirement: Elementos condicionales no simulados durante el tour

El tour NO DEBE abrir diálogos o paneles que estén cerrados, NO DEBE
disparar peticiones al servidor, y NO DEBE navegar a datos reales de la
persona usuaria únicamente para revelar un paso. Para ese contenido, el
tour DEBE explicarlo en el texto del paso más cercano ya visible, sin
resaltarlo directamente, o DEBE omitir el paso si el elemento no existe.

#### Scenario: Un elemento que depende de datos aún no cargados no rompe el tour

- GIVEN una página cuyos datos todavía se están cargando cuando se pulsa el icono de ayuda
- WHEN el tour intenta mostrar un paso cuyo elemento aún no existe
- THEN el tour omite ese paso en vez de fallar o quedarse bloqueado
