# Gestor de Gastos Personal

[![CI Backend](https://github.com/dmpinero/gestor-gastos-personal/actions/workflows/ci-backend.yml/badge.svg)](https://github.com/dmpinero/gestor-gastos-personal/actions/workflows/ci-backend.yml)
[![CI Frontend](https://github.com/dmpinero/gestor-gastos-personal/actions/workflows/ci-frontend.yml/badge.svg)](https://github.com/dmpinero/gestor-gastos-personal/actions/workflows/ci-frontend.yml)
[![E2E](https://github.com/dmpinero/gestor-gastos-personal/actions/workflows/e2e.yml/badge.svg)](https://github.com/dmpinero/gestor-gastos-personal/actions/workflows/e2e.yml)
[![Análisis de seguridad](https://github.com/dmpinero/gestor-gastos-personal/actions/workflows/security-scan.yml/badge.svg)](https://github.com/dmpinero/gestor-gastos-personal/actions/workflows/security-scan.yml)

Aplicación web para llevar el control de gastos personales.

## Arquitectura

- **Backend**: Python 3.12 + FastAPI, arquitectura hexagonal + Domain-Driven
  Design (ver [docs/adr/0001-arquitectura-hexagonal-y-ddd.md](docs/adr/0001-arquitectura-hexagonal-y-ddd.md)).
  Base de datos MySQL con SQLAlchemy + Alembic.
- **Frontend**: Vue 3 + TypeScript (SPA), Tailwind CSS, Pinia, Vue Router.
- **API**: REST, documentada automáticamente con OpenAPI (`/docs`).
- **Autenticación**: JWT propio.
- **Metodología**: SDD → BDD → TDD (ver [CONTRIBUTING.md](CONTRIBUTING.md)).

```
gestor-gastos-personal/
├── backend/    # API FastAPI (dominio, aplicación, infraestructura, interfaces)
├── frontend/   # SPA Vue 3
├── docs/       # ADRs y notas de versión
├── openspec/   # Specs SDD por funcionalidad
└── docker-compose.yml
```

## Puesta en marcha (Docker)

Requisito previo: tener [Docker](https://www.docker.com/products/docker-desktop/)
instalado y en ejecución (incluye Docker Compose). No hace falta instalar
Python, Node ni MySQL: todo corre dentro de los contenedores.

1. Clonar el repositorio y situarse en su carpeta raíz:

   ```bash
   git clone https://github.com/dmpinero/gestor-gastos-personal.git
   cd gestor-gastos-personal
   ```

2. Crear los ficheros de configuración a partir de los ejemplos (los valores
   por defecto ya sirven para evaluar la aplicación en local, no hace falta
   editarlos):

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Levantar los 3 servicios (MySQL, backend y frontend). La primera vez
   tarda unos minutos porque construye las imágenes:

   ```bash
   docker compose up -d --build
   ```

4. Comprobar que los 3 contenedores están sanos (columna `STATUS` con
   `(healthy)`; puede tardar hasta medio minuto tras el paso anterior):

   ```bash
   docker compose ps
   ```

5. **(Opcional, recomendado para evaluación)** La base de datos empieza
   vacía. Para explorar la aplicación con un conjunto de datos de ejemplo
   (cuentas, categorías, ~2 años de movimientos y previsión anual, todo
   ficticio) en lugar de partir de cero:

   ```bash
   docker compose exec backend python -m gestor_gastos.scripts.sembrar_datos_demo
   ```

   El script se niega a ejecutarse si la base de datos ya tiene alguna
   cuenta creada, así que es seguro incluso si se ejecuta por error dos
   veces. Para repetirlo desde una base de datos limpia:
   `docker compose down -v && docker compose up -d --build` (⚠️ esto borra
   todos los datos del volumen de MySQL).

6. Abrir la aplicación:

   - Frontend: http://localhost:5173
   - API: http://localhost:8000/api/v1 (documentación interactiva en http://localhost:8000/docs)
   - Comprobación de salud: http://localhost:8000/api/v1/salud
   - Métricas Prometheus: http://localhost:8000/metricas

Para detener los contenedores sin perder los datos: `docker compose down`.
Para arrancarlos de nuevo más tarde: `docker compose up -d` (sin `--build`,
ya que las imágenes siguen construidas).

## Desarrollo sin Docker

### Backend

```bash
cd backend
uv sync
cp .env.example .env   # ajusta URL_BASE_DATOS si no usas Docker para MySQL
uv run alembic upgrade head
uv run uvicorn gestor_gastos.main:app --reload
```

Calidad y tests:

```bash
uv run ruff check .          # lint
uv run ruff format .         # formato
uv run bandit -r src         # análisis de seguridad estático
uv run lint-imports           # contrato de capas (Clean Architecture)
uv run pytest --cov=src/gestor_gastos --cov-report=term-missing
```

### Frontend

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm dev
```

Calidad y tests:

```bash
pnpm exec eslint .     # lint (incluye naming-convention)
pnpm type-check        # comprobación de tipos
pnpm test:unit run     # tests unitarios (Vitest)
pnpm exec playwright install --with-deps chromium
pnpm exec playwright test   # tests E2E + accesibilidad (WCAG 2.1 AA con axe-core)
pnpm build
```

## Git y calidad

- Ramas: GitHub Flow (`feature/<slug>`, `fix/<slug>` desde `main`).
- Commits: [Conventional Commits](https://www.conventionalcommits.org/es/) en español.
- `pre-commit` instalado en el repo (gitleaks, ruff, ESLint, Prettier):
  ```bash
  uv tool install pre-commit   # una sola vez
  pre-commit install
  ```
- Ver [CONTRIBUTING.md](CONTRIBUTING.md) para la convención de idioma, Clean
  Code y el flujo SDD → BDD → TDD.

## Observabilidad

- **Logs**: estructurados en JSON (`infraestructura/observabilidad/registro_logs.py`).
- **Errores**: Sentry (configurable con `SENTRY_DSN`).
- **Métricas**: Prometheus en `/metricas`.
- **Trazas**: OpenTelemetry (configurable con `OTEL_ENDPOINT_EXPORTADOR`).

## Releases

Al fusionar a `main`, `semantic-release` calcula la versión y publica
directamente el release de GitHub agrupado por categorías (sin comitear de
vuelta a `main`, que es una rama protegida). La aplicación lee la versión y el
historial de cambios en vivo desde la API de GitHub. Ver
[CONTRIBUTING.md](CONTRIBUTING.md#releases) para el paso de redacción final de
las notas de versión.
