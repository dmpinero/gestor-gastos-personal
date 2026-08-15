# 1. Arquitectura hexagonal con Domain-Driven Design

- Estado: aceptada
- Fecha: 2026-08-15

## Contexto

El backend de Gestor de Gastos Personal necesita ser mantenible a largo plazo por
una única persona desarrolladora, permitir sustituir piezas de infraestructura
(base de datos, proveedor de autenticación, observabilidad) sin reescribir la
lógica de negocio, y facilitar el testing unitario del dominio sin depender de
FastAPI, SQLAlchemy ni de una base de datos real.

## Decisión

Se adopta una arquitectura hexagonal (puertos y adaptadores) combinada con
Domain-Driven Design táctico, organizada en cuatro capas dentro de
`backend/src/gestor_gastos/`:

- **`dominio/`**: entidades, objetos de valor, excepciones e interfaces de
  repositorio (puertos). No depende de ninguna otra capa ni de ningún framework.
- **`aplicacion/`**: casos de uso que orquestan el dominio. Solo puede depender
  de `dominio`.
- **`infraestructura/`**: adaptadores concretos (SQLAlchemy, JWT, Sentry,
  OpenTelemetry...). Puede depender de `dominio` y `aplicacion`.
- **`interfaces/`**: adaptadores de entrada (API REST con FastAPI). Puede
  depender de las tres capas anteriores.

La regla de dependencias (las capas internas no conocen a las externas) se hace
cumplir automáticamente en CI con `import-linter` (ver `backend/pyproject.toml`,
sección `[tool.importlinter]`), no solo por convención.

## Alternativas consideradas

- **Arquitectura en capas simple (Controller-Service-Repository)**: más rápida
  de arrancar, pero mezcla con facilidad reglas de negocio con detalles de
  framework/ORM a medida que el dominio crece (categorías, presupuestos,
  recurrencia de gastos...).
- **Sin capa de aplicación explícita (dominio anémico + lógica en los
  routers)**: descartada por acoplar la lógica de negocio a FastAPI desde el
  principio, dificultando el testing unitario puro.

## Consecuencias

- Más ficheros y ceremonia inicial que un CRUD directo.
- El dominio se puede testear con `pytest` sin base de datos ni HTTP.
- Cambiar de MySQL a otro motor, o de JWT propio a OAuth, implica solo escribir
  nuevos adaptadores en `infraestructura/`, sin tocar `dominio/` ni `aplicacion/`.
- El contrato de `import-linter` falla el PR si alguien introduce una
  dependencia en la dirección incorrecta.
