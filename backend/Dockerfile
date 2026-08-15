FROM python:3.12-slim AS base

COPY --from=ghcr.io/astral-sh/uv:0.11.21 /uv /uvx /usr/local/bin/

WORKDIR /aplicacion

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .
RUN uv sync --frozen --no-dev

ENV PATH="/aplicacion/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "gestor_gastos.main:app", "--host", "0.0.0.0", "--port", "8000"]
