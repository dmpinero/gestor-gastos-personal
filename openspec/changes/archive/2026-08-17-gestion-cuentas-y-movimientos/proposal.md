# Propuesta: Gestión de Cuentas y Movimientos

## Intención

La aplicación aún no tiene modelo de datos real. El usuario tiene extractos
bancarios reales (Excel exportado del banco) con movimientos de cuenta
(fecha, categoría, subcategoría, descripción, importe +/-, saldo). Necesita:
un modelo de datos que represente esos movimientos, CRUD completo desde la
interfaz para las entidades del dominio, y una vía de importación masiva
desde Excel para no tener que introducir cientos de movimientos a mano.

## Alcance

### Dentro del alcance
- Entidades de dominio: `CuentaBancaria`, `Categoria`, `Subcategoria`
  (hija de `Categoria`), `Movimiento` (asociado a cuenta + categoría +
  subcategoría opcional).
- Migraciones Alembic para las 4 tablas nuevas.
- CRUD REST + UI Vue para las 4 entidades.
- Importación de Excel (`.xls`/`.xlsx`) desde la UI: sube el fichero, extrae
  cabecera (número de cuenta, titular) y filas de movimientos, crea/actualiza
  `CuentaBancaria`, crea `Categoria`/`Subcategoria` que no existan, crea
  `Movimiento`, deduplica por (cuenta + fecha_valor + importe + saldo +
  descripción), y devuelve un resumen (creados/omitidos por duplicado/
  categorías nuevas creadas).
- Tests: unitarios (dominio/aplicación), BDD (Gherkin en español) para el
  flujo de importación, contrato (Schemathesis sobre los nuevos endpoints),
  E2E (Playwright) con capturas de pantalla de cada pantalla CRUD y del flujo
  de importación, guardadas como artefacto del test.

### Fuera de alcance
- Autenticación real de usuarios (se sigue sin login, según lo pactado).
- Presupuestos, informes o dashboards sobre los movimientos (features futuras).
- Edición masiva de movimientos (solo alta/edición/baja individual vía CRUD).
- Mapeo manual de categorías durante la importación (se auto-crean, sin UI de
  conciliación en esta iteración).

## Enfoque

Capas hexagonales en `backend/src/gestor_gastos/`: entidades y puertos de
repositorio en `dominio/`; casos de uso (`importar_movimientos_excel`,
`crear/listar/actualizar/eliminar_*`) en `aplicacion/`; modelos SQLAlchemy,
migración Alembic y el parser de Excel (adaptador) en `infraestructura/`;
routers/esquemas FastAPI en `interfaces/api/v1/`. En frontend, una vista y un
store Pinia por entidad más una vista de importación, todo en `vistas/`,
`stores/`, `componentes/`.

## Áreas afectadas

| Área | Impacto | Descripción |
|---|---|---|
| `backend/src/gestor_gastos/dominio/{cuenta,categoria,movimiento}/` | Nueva | Entidades, value objects, puertos de repositorio |
| `backend/src/gestor_gastos/aplicacion/{cuenta,categoria,movimiento}/` | Nueva | Casos de uso CRUD + importar Excel |
| `backend/src/gestor_gastos/infraestructura/persistencia/` | Nueva | Modelos SQLAlchemy + repositorios |
| `backend/alembic/versions/` | Nueva | Migración con las 4 tablas |
| `backend/src/gestor_gastos/infraestructura/importacion/` | Nueva | Parser de Excel (pandas/openpyxl/xlrd) |
| `backend/src/gestor_gastos/interfaces/api/v1/` | Nueva | Routers/esquemas de las 4 entidades + importación |
| `frontend/src/{vistas,stores,componentes,api}/` | Nueva | CRUD UI + subida de Excel |
| `backend/tests/`, `frontend/e2e/` | Nueva | Unitarios, BDD, contrato, E2E con capturas |

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Formato del Excel del banco cambia entre exportaciones | Media | Parser localiza la fila de cabecera por nombre de columna (no por índice fijo), con test unitario dedicado |
| `.xls` legado requiere `xlrd`, `.xlsx` requiere `openpyxl` | Baja | Se añaden ambas dependencias; el parser detecta el motor por extensión |
| Duplicados por reglas de negocio ambiguas (misma fecha/importe/saldo pero movimiento distinto real) | Baja | Regla de deduplicación ya acordada con el usuario; se documenta en la spec y es ajustable |

## Plan de rollback

Cambio aditivo: nuevas tablas, sin tocar datos existentes (no hay datos aún
en producción). Rollback = `alembic downgrade -1` de la migración añadida;
en frontend/backend, revertir el PR de la funcionalidad. Sin migración de
datos que deshacer.

## Dependencias

- Backend: `pandas`, `openpyxl` (.xlsx), `xlrd` (.xls) como dependencias nuevas.
- Ninguna dependencia externa de infraestructura nueva (usa MySQL ya
  configurado en docker-compose).

## Criterios de éxito

- [ ] Las 4 entidades tienen migración, CRUD por API y CRUD por UI funcionando.
- [ ] Subir `movements-1682026.xls` real importa sus ~69 movimientos, crea la
      cuenta y las categorías/subcategorías que no existían, sin duplicar si
      se sube dos veces.
- [ ] Suite BDD, unitarios y contrato en verde; E2E con capturas guardadas.
