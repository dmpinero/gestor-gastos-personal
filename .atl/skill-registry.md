# Registro de skills — gestor-gastos-personal

Generado por `sdd-init`. Escanea skills de usuario en `~/.claude/skills/` (no se
encontraron skills a nivel de proyecto ni ficheros `AGENTS.md`/`CLAUDE.md` en la
raíz del repo en el momento de generar este registro).

| Skill | Descripción | Disparador |
|---|---|---|
| `revision-clean-code` | Revisión asistida de Clean Code y Clean Architecture sobre el diff de una rama frente a `main` (nombres, SRP, fugas de capa, anglicismos). | `/revision-clean-code`, antes de fusionar un PR no trivial |
| `generar-release-notes` | Reescribe en prosa narrativa (estilo VS Code) el borrador de release notes de `semantic-release`, agrupado por categorías. | `/generar-release-notes`, al cerrar una versión |
| `branch-pr` | Flujo de creación de PR para Agent Teams Lite (issue-first). | Al crear un Pull Request |
| `issue-creation` | Flujo de creación de issues de GitHub (issue-first). | Al crear un issue de bug/feature |
| `judgment-day` | Revisión adversarial en paralelo con dos jueces independientes. | "judgment day", "revisión adversarial" |
| `simplify` | Revisión de reutilización, simplificación y eficiencia del código cambiado (no busca bugs). | Tras implementar, antes de dar por cerrado un cambio |
| `security-review` | Revisión de seguridad de los cambios pendientes en la rama actual. | Antes de fusionar cambios sensibles |
| `review` | Revisión de una Pull Request de GitHub. | Al revisar un PR ya abierto |
| `go-testing` | Patrones de testing en Go (incluye Bubbletea/teatest). | No aplica a este proyecto (stack Python/Vue) |
| `excalidraw-diagram-skill` | Generación de diagramas Excalidraw. | Al pedir diagramas de arquitectura/flujo |
| `dataviz` | Guía de diseño para gráficos y dashboards. | Al crear cualquier visualización de datos |
| `artifact-design` / `artifact-capabilities` | Guía de diseño y capacidades runtime para Artifacts. | Al publicar un Artifact |
| `update-config` | Configuración del harness de Claude Code (`settings.json`, hooks, permisos). | "permite X", "añade un hook", cambios de configuración |
| `keybindings-help` | Personalización de atajos de teclado de Claude Code. | Al pedir rebind de teclas |
| `fewer-permission-prompts` | Reduce prompts de permisos repetidos, generando allowlist. | Al pedir reducir confirmaciones de Bash/MCP |
| `loop` / `schedule` | Ejecución recurrente de prompts/slash-commands o agentes en cron. | Tareas periódicas o programadas |
| `claude-api` | Referencia de la API de Claude/Anthropic SDK. | Preguntas sobre modelos, precios, streaming, tool use |
| `claude-in-chrome` | Automatización del navegador Chrome. | Tareas que requieran interactuar con páginas web |
| `run` | Arranca y prueba la app del proyecto en local. | "arranca la app", "pruébalo en el navegador" |
| `init` | Inicializa un `CLAUDE.md` con documentación del repo. | Al pedir documentar el repo para Claude Code |
| `skill-creator` | Creación de nuevas skills siguiendo el spec de Agent Skills. | Al crear una skill nueva |
| `engram:memory` | Protocolo de memoria persistente (siempre activo). | Decisiones, convenciones, bugs a recordar entre sesiones |

Skills `sdd-*` (init/explore/propose/spec/design/tasks/apply/verify/archive) y
`skill-registry` se omiten de esta tabla por instrucción explícita del flujo de
`sdd-init`; son las que orquestan y mantienen este propio flujo SDD.

Relevantes para el día a día de este proyecto: **`revision-clean-code`** y
**`generar-release-notes`** (creadas específicamente para este repo), además de
`simplify`, `security-review`, `branch-pr`/`issue-creation` y el ciclo `sdd-*`.
