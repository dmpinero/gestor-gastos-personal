# Gestor de Gastos Personal — Documento de entrega

## a. Descripción general del proyecto

Gestor de Gastos Personal es una aplicación web para llevar el control de
las finanzas domésticas: cuentas bancarias, movimientos (ingresos y gastos),
categorización, previsión anual de gastos frente a lo realmente gastado,
notificaciones de desviaciones, adjuntos a los movimientos (tickets,
facturas) y backup/restauración completa de los datos.

Permite **importar movimientos automáticamente** desde extractos bancarios
en PDF o ficheros Excel, en lugar de introducirlos a mano, y a partir de ahí
ofrece una visión agregada (dashboard, historial por categoría, resumen
anual) para entender en qué se gasta y compararlo con lo previsto.

El proyecto está construido siguiendo **arquitectura hexagonal + Domain-Driven
Design** en el backend (documentado en
[`docs/adr/0001-arquitectura-hexagonal-y-ddd.md`](docs/adr/0001-arquitectura-hexagonal-y-ddd.md))
y una metodología de desarrollo **SDD → BDD → TDD** (especificación →
comportamiento → implementación), descrita en [`CONTRIBUTING.md`](CONTRIBUTING.md).

## b. Stack tecnológico utilizado

### Backend

| Área | Tecnología |
|---|---|
| Lenguaje / runtime | Python ≥ 3.12 |
| Framework API | FastAPI + Uvicorn |
| Gestor de dependencias | [uv](https://docs.astral.sh/uv/) |
| Base de datos | MySQL 8.4 |
| ORM / migraciones | SQLAlchemy + Alembic |
| Autenticación | JWT propio (PyJWT + Passlib/Argon2) |
| Importación de ficheros | pandas, openpyxl, xlrd (Excel), pdfplumber (PDF) |
| Observabilidad | logs JSON estructurados, Sentry, Prometheus, OpenTelemetry |
| Calidad | Ruff (lint + formato), Bandit (SAST), import-linter (capas), pytest + pytest-bdd + pytest-cov, Schemathesis (contrato OpenAPI) |

### Frontend

| Área | Tecnología |
|---|---|
| Framework | Vue 3 (Composition API) + TypeScript |
| Build tool | Vite |
| Estado | Pinia |
| Enrutado | Vue Router |
| Estilos | Tailwind CSS v4 |
| Componentes UI | Reka UI, Lucide (iconos) |
| Exportación de datos | ExcelJS, jsPDF + jspdf-autotable |
| Gestor de paquetes | pnpm |
| Calidad | ESLint + oxlint, Prettier, vue-tsc (tipos), Vitest (unitarios), Playwright + axe-core (E2E y accesibilidad WCAG 2.1 AA) |

### Infraestructura y despliegue

- **Docker** (multi-stage) para backend y frontend, orquestados con
  `docker-compose.yml` en local (backend + frontend + MySQL).
- **nginx** sirve el build estático del frontend y actúa de reverse proxy
  hacia el backend (`/api/v1/*`), con resolución del hostname del backend
  parametrizable por variable de entorno — preparado para desplegarse como
  servicios independientes en plataformas como Railway o Render, además de
  en docker-compose.
- **GitHub Actions**: CI de backend, CI de frontend, tests E2E, análisis de
  seguridad y publicación automática de releases (`semantic-release`).
- **Dependabot** para mantenimiento de dependencias.

## c. Información sobre su instalación y ejecución

### Requisito previo

Tener [Docker](https://www.docker.com/products/docker-desktop/) instalado y
en ejecución (incluye Docker Compose). No es necesario instalar Python, Node
ni MySQL de forma local: todo corre dentro de los contenedores.

### Puesta en marcha con Docker (recomendado)

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/dmpinero/gestor-gastos-personal.git
   cd gestor-gastos-personal
   ```

2. Crear los ficheros de configuración a partir de los ejemplos (los valores
   por defecto ya sirven para evaluar la aplicación en local):

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Levantar los tres servicios (MySQL, backend y frontend). La primera vez
   tarda unos minutos porque construye las imágenes:

   ```bash
   docker compose up -d --build
   ```

4. Comprobar que los tres contenedores están sanos (columna `STATUS` con
   `(healthy)`; puede tardar hasta medio minuto):

   ```bash
   docker compose ps
   ```

5. **(Opcional, recomendado para evaluación)** La base de datos empieza
   vacía. Para explorar la aplicación con un conjunto de datos de ejemplo
   (cuentas, categorías, ~2 años de movimientos y previsión anual, todo
   ficticio):

   ```bash
   docker compose exec backend python -m gestor_gastos.scripts.sembrar_datos_demo
   ```

   El script se niega a ejecutarse si ya existe alguna cuenta, así que es
   seguro aunque se ejecute por error dos veces. Para repetirlo desde una
   base de datos limpia: `docker compose down -v && docker compose up -d
   --build` (⚠️ esto borra todos los datos del volumen de MySQL).

6. Abrir la aplicación:

   - **Frontend**: http://localhost:5173
   - **API**: http://localhost:8000/api/v1 (documentación interactiva en http://localhost:8000/docs)
   - **Comprobación de salud**: http://localhost:8000/api/v1/salud
   - **Métricas Prometheus**: http://localhost:8000/metricas

Para detener los contenedores sin perder datos: `docker compose down`. Para
arrancarlos de nuevo más tarde: `docker compose up -d` (sin `--build`).

### Desarrollo sin Docker

**Backend:**

```bash
cd backend
uv sync
cp .env.example .env   # ajustar URL_BASE_DATOS si no se usa Docker para MySQL
uv run alembic upgrade head
uv run uvicorn gestor_gastos.main:app --reload
```

Calidad y tests:

```bash
uv run ruff check .                              # lint
uv run ruff format .                             # formato
uv run bandit -r src                             # análisis de seguridad estático
uv run lint-imports                              # contrato de capas (arquitectura hexagonal)
uv run pytest --cov=src/gestor_gastos --cov-report=term-missing
```

**Frontend:**

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm dev
```

Calidad y tests:

```bash
pnpm exec eslint .                               # lint
pnpm type-check                                  # comprobación de tipos
pnpm test:unit run                                # tests unitarios (Vitest)
pnpm exec playwright install --with-deps chromium
pnpm exec playwright test                         # tests E2E + accesibilidad
pnpm build
```

## d. Estructura del proyecto

```
gestor-gastos-personal/
├── backend/
│   ├── src/gestor_gastos/
│   │   ├── dominio/            # entidades y reglas de negocio (sin dependencias externas)
│   │   │   ├── cuenta/ categoria/ movimiento/ prevision/ adjunto/
│   │   │   ├── importacion/ exportacion/ notificaciones/ dashboard/
│   │   │   └── excepciones.py
│   │   ├── aplicacion/         # casos de uso que orquestan el dominio
│   │   │   └── (mismo desglose por subdominio que dominio/)
│   │   ├── infraestructura/    # adaptadores: implementan los protocolos del dominio
│   │   │   ├── persistencia/   # repositorios SQLAlchemy, modelos ORM
│   │   │   ├── almacenamiento/ # adjuntos en disco
│   │   │   ├── seguridad/      # JWT, hashing de contraseñas
│   │   │   ├── importacion/ exportacion/ prevision/
│   │   │   └── observabilidad/ # logs, métricas, trazas
│   │   ├── interfaces/api/     # capa HTTP (FastAPI)
│   │   │   ├── v1/enrutadores/ # cuentas, categorias, movimientos, previsiones,
│   │   │   │                   # importacion, exportacion, adjuntos, notificaciones, dashboard
│   │   │   ├── v1/esquemas/    # modelos Pydantic de entrada/salida
│   │   │   ├── manejadores_errores.py
│   │   │   └── middleware/
│   │   ├── scripts/            # sembrar_datos_demo.py y similares
│   │   └── main.py             # construcción de la app FastAPI
│   ├── tests/                  # unitarios, integración, BDD (Gherkin), contrato OpenAPI
│   ├── alembic/versions/       # migraciones de base de datos
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── vistas/             # una vista Vue por pantalla (Inicio, Movimientos, Importar,
│   │   │                       # Historial, Resumen anual, Notificaciones, Gestión, Backup)
│   │   ├── componentes/        # componentes reutilizables (modales, tablas, formularios)
│   │   ├── stores/              # estado global con Pinia
│   │   ├── api/                 # cliente HTTP y tipos de la API
│   │   ├── composables/         # lógica reutilizable (Composition API)
│   │   ├── router/              # definición de rutas (Vue Router)
│   │   └── lib/                  # utilidades (exportación a Excel/PDF, etc.)
│   ├── e2e/                      # tests end-to-end (Playwright)
│   ├── Dockerfile
│   ├── nginx.conf.template       # proxy reverso hacia el backend
│   └── package.json
├── docs/
│   ├── adr/                      # decisiones de arquitectura (ADRs)
│   ├── manual-usuario/           # manual de usuario con capturas, una página por pantalla
│   └── release-notes/            # redacción final de cada versión publicada
├── openspec/                     # especificaciones SDD por funcionalidad
├── docker-compose.yml             # orquestación local: MySQL + backend + frontend
└── README.md
```

La separación en `dominio / aplicación / infraestructura / interfaces` del
backend no es solo organizativa: un contrato de arquitectura (`import-linter`)
se verifica en cada ejecución de CI y falla la build si una capa interna
importa algo de una capa que no debería (p. ej. que el dominio dependa de
SQLAlchemy).

## e. Funcionalidades principales

- **Dashboard**: resumen visual del estado financiero actual (saldo por
  cuenta, gasto del mes, comparación con lo previsto).
- **Movimientos**: alta, edición, eliminación y listado filtrable de
  ingresos y gastos, con adjuntos (tickets/facturas) asociables a cada
  movimiento.
- **Importación de extractos**:
  - Desde **PDF** de banco: extracción automática de movimientos y
    propuesta de categoría/subcategoría a partir de asociaciones por
    descripción ya configuradas.
  - Desde **Excel**: análisis previo con propuesta de categorización (igual
    criterio que PDF) y pantalla de revisión antes de confirmar la
    importación, para corregir fila a fila si procede.
- **Historial de gastos**: consulta de movimientos pasados agrupados por
  categoría o subcategoría.
- **Resumen anual**: comparación de lo previsto frente a lo gastado
  realmente, mes a mes y categoría a categoría, con exportación e
  importación de la previsión completa.
- **Gestión**:
  - **Cuentas**: alta/edición/baja de cuentas bancarias.
  - **Categorías**: gestión de categorías y subcategorías de gasto.
  - **Asociar conceptos**: vínculo entre los conceptos previstos del
    Resumen anual y las categorías reales de Movimientos, por categoría o
    por fragmento de descripción, para los casos en que no se llaman
    igual.
- **Notificaciones**: avisos de desviaciones entre lo previsto y lo real.
- **Backup**:
  - **Realizar backup**: exportación completa de los datos (cuentas,
    categorías, movimientos, previsión, asociaciones) a un fichero
    descargable.
  - **Importar backup**: restauración completa a partir de un backup
    previo (operación destructiva: sustituye todos los datos actuales).
- **Autenticación**: acceso protegido mediante JWT propio.
- **Observabilidad**: logs estructurados, métricas Prometheus, trazas
  OpenTelemetry y captura de errores con Sentry, listas para un entorno de
  producción real.

Cada pantalla está documentada con capturas en detalle en el
[manual de usuario](docs/manual-usuario/README.md).
