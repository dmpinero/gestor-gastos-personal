# Proposal: Manual de usuario interactivo

## Intención

La aplicación no tiene ninguna guía para orientar a una persona usuaria
nueva sobre qué hace cada sección del panel lateral. Se quiere un tour
guiado, lanzable bajo demanda desde un icono junto al conmutador de tema,
que resalte cada sección y explique brevemente su propósito.

## Alcance

### Dentro de alcance
- Icono nuevo en `BarraSuperior.vue`, junto a `ConmutadorTema.vue`, que
  lanza el tour al pulsarlo.
- Tour con Driver.js (ver ADR
  [0002](../../../docs/adr/0002-driverjs-para-el-manual-de-usuario-interactivo.md))
  que recorre: las 6 secciones del panel lateral (Dashboard, Gestión,
  Importar, Historial, Resumen anual, Administración), el conmutador de
  tema y el propio icono de ayuda.
- Estilado del overlay/popover adaptado a las variables oklch de
  `main.css`, coherente en claro y oscuro.
- Accesible por teclado (Driver.js lo soporta de fábrica) y compatible con
  axe-core (sin violaciones WCAG 2.1 AA nuevas).

### Fuera de alcance
- Tours contextuales por vista (explicar cada botón de Movimientos,
  Resumen anual, etc.): se deja para una iteración futura si se pide.
- Persistir si el usuario ya vio el tour / mostrarlo automáticamente en el
  primer uso: se lanza solo bajo demanda, nunca automáticamente.
- Traducción a otros idiomas: solo español, como el resto de la interfaz.

## Enfoque

Un composable `useTourGuiado.ts` construye los pasos de Driver.js
seleccionando elementos por atributo `data-tour` (no por texto visible, que
puede cambiar) y expone `iniciar()`. Un componente `BotonManualUsuario.vue`
(icono, junto a `ConmutadorTema.vue`) lo invoca al pulsarlo. El panel
lateral (`BarraLateral.vue`) recibe atributos `data-tour="nav-<seccion>"` en
cada enlace de sección.

## Áreas afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `frontend/package.json` | Modificado | Nueva dependencia `driver.js` |
| `frontend/src/composables/useTourGuiado.ts` | Nuevo | Definición y arranque del tour |
| `frontend/src/componentes/layout/BotonManualUsuario.vue` | Nuevo | Icono que lanza el tour |
| `frontend/src/componentes/layout/BarraSuperior.vue` | Modificado | Incluye el nuevo botón junto al conmutador de tema |
| `frontend/src/componentes/layout/BarraLateral.vue` | Modificado | Atributos `data-tour` en cada sección |
| `frontend/src/assets/main.css` | Modificado | Estilos de Driver.js adaptados a los tokens de color existentes |
| `frontend/e2e/manual-usuario.spec.ts` | Nuevo | Verificación E2E del tour |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| El tour queda desactualizado si cambia la navegación del panel lateral | Media | Pasos definidos por `data-tour` (atributo estable), no por texto visible |
| Los estilos por defecto de Driver.js no encajan con el tema oscuro | Media | CSS propio sobre las clases de Driver.js, usando las variables oklch ya definidas |

## Plan de rollback

Cambio aditivo (icono + composable + dependencia nueva): revertir el PR
elimina el botón y el tour sin afectar a ninguna otra funcionalidad ni a
datos.

## Dependencias

- `driver.js` (MIT), nueva dependencia de frontend.

## Criterios de éxito

- [ ] Pulsar el icono junto al conmutador de tema lanza el tour.
- [ ] El tour resalta, en orden, las 6 secciones del panel lateral, el
      conmutador de tema y el icono de ayuda, con una explicación breve de
      cada una.
- [ ] El tour se ve correctamente tanto en modo claro como oscuro.
- [ ] Sin violaciones de accesibilidad WCAG 2.1 AA nuevas (axe-core).
