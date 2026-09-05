# 2. Driver.js para el manual de usuario interactivo

- Estado: aceptada
- Fecha: 2026-09-05

## Contexto

Se quiere ofrecer un manual de usuario interactivo (guía paso a paso que
resalta elementos de la interfaz), lanzable desde un icono junto al
conmutador de tema claro/oscuro. Hacía falta elegir una librería de "product
tour" para Vue 3 + TypeScript. Las dos candidatas evaluadas fueron
[Driver.js](https://github.com/kamranahmedse/driver.js) y
[Shepherd.js](https://github.com/shipshapecode/shepherd), las dos más usadas
del ecosistema.

Este es un repositorio privado y de código cerrado (no se libera como
software libre), lo que hace relevante la licencia de cualquier dependencia
nueva, no solo sus prestaciones técnicas.

## Decisión

Se adopta **Driver.js**.

Comparativa (verificada en las fuentes originales, no de memoria):

| | Driver.js | Shepherd.js |
|---|---|---|
| Licencia | MIT | **AGPL-3.0 / Comercial (dual)** |
| Tamaño | ~5 KB gzip | Mayor (usa Floating UI como dependencia) |
| Dependencias | Cero, TypeScript nativo | Floating UI |
| Estrellas GitHub | 26.7k | 13.8k |
| Mantenimiento | Activo | Activo |

El factor decisivo es la licencia: el
[`LICENSE.md`](https://github.com/shipshapecode/shepherd/blob/main/LICENSE.md)
de Shepherd.js establece que la licencia comercial de pago es obligatoria
para *"aplicaciones de código cerrado"* y *"herramientas internas de negocio
en empresas con ánimo de lucro"*. Usarlo en un repositorio privado sin pagar
esa licencia sería, como mínimo, una zona gris legal. Driver.js es MIT puro,
sin ninguna restricción de este tipo.

## Alternativas consideradas

- **Shepherd.js**: descartada por la licencia dual AGPL-3.0/comercial (ver
  arriba), pese a tener algo más de flexibilidad de posicionamiento
  (construida sobre Floating UI) y ser igualmente activa en mantenimiento.
- **Construir el tour a medida** (sin librería, con Reka UI/Popover ya
  presente en el proyecto): descartada por reinventar funcionalidad ya
  resuelta (gestión de pasos, overlay, resaltado de elemento, navegación por
  teclado) sin necesidad real de personalización que lo justifique.

## Consecuencias

- Nueva dependencia de frontend: `driver.js` (MIT, ~5 KB gzip, cero
  dependencias transitivas).
- El estilado del tour (overlay, popover, botones) se adapta a los tokens de
  color ya definidos en `frontend/src/assets/main.css` (variables oklch,
  `:root`/`.dark`) en vez de usar el CSS por defecto de la librería, para que
  respete el modo claro/oscuro existente.
- Si en el futuro se necesitara publicar este repositorio como código
  abierto, Driver.js no impone ninguna restricción adicional (a diferencia de
  lo que habría ocurrido con Shepherd.js bajo AGPL-3.0).
