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

El tour DEBE recorrer, en este orden, un paso por cada uno de los siguientes
elementos, mostrando una explicación breve de su propósito: las 6 secciones
del panel lateral (Dashboard, Gestión, Importar, Historial, Resumen anual,
Administración), el conmutador de tema, y el propio icono de ayuda.

#### Escenario: Avanzar por los pasos del tour
- Dado que el tour está activo en su primer paso
- Cuando la persona usuaria pulsa "Siguiente" repetidamente
- Entonces el tour resalta cada uno de los elementos, en el orden indicado, hasta llegar al último paso

#### Escenario: Retroceder a un paso anterior
- Dado que el tour está en un paso posterior al primero
- Cuando la persona usuaria pulsa "Anterior"
- Entonces el tour vuelve a resaltar el elemento del paso previo

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
