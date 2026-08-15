# Gestor de Gastos Personal

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

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8000/api/v1 (documentación interactiva en http://localhost:8000/docs)
- Comprobación de salud: http://localhost:8000/api/v1/salud
- Métricas Prometheus: http://localhost:8000/metricas

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

Al fusionar a `main`, `semantic-release` calcula la versión y genera el
`CHANGELOG.md` y el release de GitHub agrupado por categorías. Ver
[CONTRIBUTING.md](CONTRIBUTING.md#releases) para el paso de redacción final de
las notas de versión.
