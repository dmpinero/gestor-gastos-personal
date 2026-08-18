# Guía de contribución

## Idioma del código: español de España

Clases, funciones/métodos, variables, comentarios, documentación (README, ADRs,
PRs, issues) y el cuerpo de los mensajes de commit se escriben en español de
España.

**Excepciones** (no son "nuestro código", son contratos de herramientas):

- Prefijos de Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `test:`, `perf:`, `ci:`, `build:`). La descripción que sigue sí va
  en español: `feat: añadir endpoint para crear gastos`.
- Convenciones obligatorias de frameworks/gestores de paquetes: `src/`, `tests/`,
  `main.py`, `package.json`, `docker-compose.yml`, `.github/`, `Dockerfile`,
  claves de configuración YAML/JSON.
- Términos técnicos sin traducción natural asentada: `middleware`, `router`,
  `token`, `hash`, `commit`, `pipeline`, `endpoint`.
- Nombres de librerías/APIs de terceros (`SQLAlchemy`, `FastAPI`, `Pinia`...).

Vocabulario de dominio de referencia: `Gasto`, `Usuario`, `Categoria`,
`Importe`/`Dinero`, `RepositorioGastos`, `crear_gasto`, `listar_gastos`,
`autenticar_usuario`.

## Arquitectura: hexagonal + DDD

El backend está organizado en capas (`dominio` → `aplicacion` → `infraestructura`
→ `interfaces`); ver [docs/adr/0001-arquitectura-hexagonal-y-ddd.md](docs/adr/0001-arquitectura-hexagonal-y-ddd.md).
La regla de dependencias se comprueba automáticamente con `import-linter` en CI:
`dominio` no puede importar nada de las otras capas.

## Metodología: SDD → BDD → TDD

1. **SDD**: toda funcionalidad nueva se especifica primero en `openspec/`
   (requisitos + escenarios de aceptación), usando las skills `sdd-*`.
2. **BDD**: los escenarios se traducen a Gherkin en español
   (`backend/tests/bdd/caracteristicas/*.feature`, con `# language: es`) y se
   ejecutan con `pytest-bdd`.
3. **TDD**: cada paso se implementa escribiendo primero un test unitario en
   `backend/tests/unitarios/` (rojo → verde → refactor).

## Clean Code

- Nombres expresivos y de una sola responsabilidad por función/clase, aunque
  estén en español.
- `ruff` (con `pep8-naming`) y `import-linter` bloquean el PR si se rompen las
  convenciones de nombres o las capas de la arquitectura en el backend.
- `ESLint` con la regla `naming-convention` hace lo propio en el frontend.
- Antes de fusionar un PR no trivial, ejecuta la skill `/revision-clean-code`
  para una revisión asistida de nombres, responsabilidad única y fugas entre
  capas que las reglas automáticas no detectan.

## Git

- Estrategia de ramas: GitHub Flow. `main` siempre desplegable, sin pushes
  directos.
- Una rama por funcionalidad/corrección: `feature/<slug>` o `fix/<slug>`, con el
  slug en español (p. ej. `feature/crear-gasto`).
- Commits en formato [Conventional Commits](https://www.conventionalcommits.org/es/).
- Todo cambio entra por Pull Request, con la plantilla de
  `.github/PULL_REQUEST_TEMPLATE.md` y los checks de CI en verde.

## Releases

Al fusionar a `main`, `semantic-release` calcula la versión y publica
directamente un release de GitHub agrupado por categorías (`✨ Novedades`,
`🐛 Corregido`, `🔧 Mejoras`, `⚙️ Cambios internos`); no actualiza ningún
fichero en el repositorio (`main` es una rama protegida sin pushes directos).
La aplicación lee la versión y el historial de cambios en vivo desde la API
de GitHub (`frontend/src/api/github.ts`), así que siempre coinciden con la
última release publicada. Antes de publicar la versión final, ejecuta la
skill `/generar-release-notes` para reescribir ese borrador en prosa
narrativa (estilo "Novedades de la versión" de Visual Studio Code) en
`docs/release-notes/`.
