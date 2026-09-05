# Especificación: Manual de usuario interactivo

## Propósito

Ofrecer una guía interactiva ("product tour") que oriente a una persona
usuaria sobre las secciones principales de la aplicación, lanzable bajo
demanda desde la interfaz.

## Requisitos

### Requisito: Lanzar el tour desde el icono de ayuda

El sistema DEBE mostrar un icono de ayuda junto al conmutador de tema
claro/oscuro en la barra superior. Al pulsarlo, DEBE iniciar el tour guiado
desde su primer paso.

#### Escenario: Pulsar el icono inicia el tour
- Dado que la persona usuaria está en cualquier vista de la aplicación
- Cuando pulsa el icono de ayuda de la barra superior
- Entonces se muestra el primer paso del tour, resaltando el elemento correspondiente

### Requisito: El tour nunca se lanza automáticamente

El sistema NO DEBE iniciar el tour por sí solo en ningún momento (ni en el
primer uso, ni al navegar, ni al recargar la página); DEBE iniciarse
únicamente cuando la persona usuaria pulsa el icono de ayuda.

#### Escenario: Cargar la aplicación no lanza el tour
- Dado que la persona usuaria abre la aplicación por primera vez
- Cuando la aplicación termina de cargar
- Entonces el tour no se muestra hasta que se pulse el icono de ayuda

### Requisito: Recorrido de las secciones principales

Al lanzarse desde una página, el tour DEBE empezar con un único paso de
orientación que resalta, en el menú lateral, la sección a la que pertenece
esa página, mostrando una explicación breve de su propósito. A continuación
DEBE recorrer los pasos específicos de la funcionalidad de esa página (si
la página tiene tour registrado). El tour NO DEBE recorrer las secciones del
menú distintas de la activa. El tour SIEMPRE DEBE terminar con un paso para
el conmutador de tema y un paso para el propio icono de ayuda.

#### Escenario: Lanzar el tour desde Movimientos recorre Movimientos, no las demás secciones
- Dado que la persona usuaria está en Gestión → Movimientos
- Cuando pulsa el icono de ayuda
- Entonces el primer paso resalta la sección "Gestión" del menú lateral, los siguientes pasos recorren la funcionalidad propia de Movimientos, ningún paso resalta las demás secciones, y el tour termina con el conmutador de tema y el icono de ayuda

#### Escenario: Lanzar el tour desde el Dashboard recorre sus tarjetas y bloques
- Dado que la persona usuaria está en el Dashboard
- Cuando pulsa el icono de ayuda
- Entonces los pasos recorren el saldo global, las tarjetas por cuenta, y los bloques de gastos e ingresos por categoría

#### Escenario: Avanzar por los pasos del tour
- Dado que el tour está activo en su primer paso
- Cuando la persona usuaria pulsa "Siguiente" repetidamente
- Entonces el tour resalta cada uno de los elementos, en el orden indicado, hasta llegar al último paso

#### Escenario: Retroceder a un paso anterior
- Dado que el tour está en un paso posterior al primero
- Cuando la persona usuaria pulsa "Anterior"
- Entonces el tour vuelve a resaltar el elemento del paso previo

### Requisito: Elementos condicionales forzados temporalmente durante el tour

Cuando un paso del tour corresponde a un control que solo es visible bajo
cierto estado local y reversible de la página (un filtro concreto, un modo
de vista, una fila seleccionada), el sistema DEBE ajustar ese estado antes
de mostrar el paso para que el control se resalte realmente, y DEBE
restaurar el estado que había antes de iniciar el tour al cerrarse este,
sea cual sea el motivo del cierre (botón cerrar, tecla Escape, o llegar al
último paso).

#### Escenario: "Mes anterior"/"Mes siguiente" se muestran durante el tour de Movimientos
- Dado que la persona usuaria está en Movimientos con el filtro de fechas vacío
- Cuando el tour llega al paso de "Mes anterior"/"Mes siguiente"
- Entonces esos botones son visibles y quedan resaltados, y al cerrar el tour el filtro de fechas vuelve a estar vacío como antes de iniciarlo

#### Escenario: La barra de selección múltiple se muestra durante el tour
- Dado que la persona usuaria está en Cuentas, Categorías o Movimientos sin ninguna fila seleccionada
- Cuando el tour llega al paso de la selección múltiple
- Entonces la primera fila aparece marcada y la barra de acciones en bloque es visible, y al cerrar el tour ninguna fila queda seleccionada

### Requisito: Elementos condicionales no simulados durante el tour

El tour NO DEBE abrir diálogos o paneles que estén cerrados, NO DEBE
disparar peticiones al servidor, y NO DEBE navegar a datos reales de la
persona usuaria únicamente para revelar un paso. Para ese contenido, el
tour DEBE explicarlo en el texto del paso más cercano ya visible, sin
resaltarlo directamente, o DEBE omitir el paso si el elemento no existe.

#### Escenario: Un elemento que depende de datos aún no cargados no rompe el tour
- Dado que una página cuyos datos todavía se están cargando cuando se pulsa el icono de ayuda
- Cuando el tour intenta mostrar un paso cuyo elemento aún no existe
- Entonces el tour omite ese paso en vez de fallar o quedarse bloqueado

### Requisito: Cerrar el tour en cualquier momento

El sistema DEBE permitir cerrar el tour antes de llegar al último paso,
mediante el botón de cerrar, la tecla Escape, o un click fuera del recuadro
de explicación, sin que eso afecte a ningún dato de la aplicación.

#### Escenario: Cerrar con el botón
- Dado que el tour está activo en un paso intermedio
- Cuando la persona usuaria pulsa el botón de cerrar
- Entonces el tour desaparece y la aplicación queda en la vista donde se cerró

#### Escenario: Cerrar con la tecla Escape
- Dado que el tour está activo
- Cuando la persona usuaria pulsa la tecla Escape
- Entonces el tour se cierra igual que con el botón de cerrar

### Requisito: Accesibilidad del tour

El tour DEBE poder recorrerse por completo usando solo el teclado, y NO DEBE
introducir ninguna violación de accesibilidad WCAG 2.1 AA (verificada con
axe-core), tanto en modo claro como en modo oscuro.

#### Escenario: Navegación completa por teclado
- Dado que el tour está activo
- Cuando la persona usuaria usa solo el teclado (Tab, Enter, flechas, Escape)
- Entonces puede avanzar, retroceder y cerrar el tour sin usar el ratón

#### Escenario: Sin violaciones de accesibilidad en modo oscuro
- Dado que la aplicación está en modo oscuro
- Cuando se lanza el tour y se audita la página con axe-core
- Entonces no se reportan violaciones WCAG 2.1 AA
