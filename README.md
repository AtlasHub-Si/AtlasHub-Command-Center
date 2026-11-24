# AtlasHQ — Command Center

**One ecosystem. Connected intelligence. Governed execution.**

![AtlasHub Galaxy — Command Center concept](assets/atlas-hub-galaxy.jpg)

AtlasHQ is the central operating and command experience for the AtlasHub ecosystem. It provides a unified view across the group's knowledge, infrastructure, AI workforce, customer relationships, projects and governance — connecting existing systems without unnecessarily replacing them.

The product vision is an **AtlasHub Galaxy**: a connected environment in which each domain has a clear responsibility, while people can navigate from the group level into a company, venture, project, team, agent or system and retain the full context.

> **Concept visual:** the Galaxy image communicates the intended experience and information architecture. It is a product direction, not a claim that every module or live metric shown is already implemented.

## Product map

| Project | Responsibility | Scope |
|---|---|---|
| **AtlasHQ** | Command Center | Group-wide overview, navigation, contextual workspace, cross-project visibility and governance cockpit |
| **AtlasBot** | Agent interface & orchestration | Human–AI interaction, executive assistance, agent coordination, approvals and governed actions |
| **AtlasCortex** | Knowledge & intelligence | GBrain, Knowledge Hub, federated memory, knowledge graph and Obsidian/Markdown knowledge sources |
| **AtlasInfra** | Infrastructure & platform operations | VPS, services, deployments, databases, observability, providers, models, APIs and AI Gateway |
| **AtlasDesk** | CRM & voice | Companies, contacts, customers, partners, commercial pipeline, conversations and voice workflows |

These are distinct product responsibilities, not duplicate databases or independent copies of the same capabilities. Integrations should preserve each system's source of truth.

## How the ecosystem fits together

- **AtlasHQ** is the unified control surface and context layer.
- **AtlasBot** is the interaction and agent-governance layer; execution remains delegated to approved runtimes.
- **AtlasCortex** provides governed organizational memory and knowledge retrieval.
- **AtlasInfra** exposes operational infrastructure and platform health.
- **AtlasDesk** manages customer and partner relationships, commercial activity and voice-enabled interactions.

Projects, ventures, teams and agents are connected entities across these domains — not additional competing product silos.

## Architecture principles

1. **Integrate before building.** Reuse existing systems and capabilities wherever practical.
2. **One source of truth per domain.** AtlasHQ connects and contextualizes; it should not duplicate every underlying system.
3. **Clear boundaries.** Each Atlas project has an explicit mission, ownership and interface.
4. **Governed autonomy.** Agents operate within defined permissions, risk levels, approvals and audit trails.
5. **Security by design.** Identity, least privilege, tenant isolation and secret handling are foundational.
6. **Real data only.** Dashboards must distinguish live telemetry, synchronized records, estimates and illustrative placeholders.
7. **2D first, spatial when useful.** The Galaxy view complements practical tables, search and operational screens.

## Current status

**Discovery and architecture definition.** The Command Center is being specified before implementation is expanded. The immediate work is to inventory existing projects and systems, confirm ownership and integrations, define the shared entity model, and validate the first operational experience.

### Primary planning document

[**RFC-001 — Complete Discovery, Architecture & Product Study**](https://github.com/AtlasHub-Si/AtlasHub-Command-Center/issues/1)

The RFC records the product thesis, architecture, security boundaries, technology assessment, MVP scope, roadmap, risks and discovery deliverables.

## Future direction

The internal AtlasHQ environment may later provide a foundation for separately permissioned customer workspaces. Any customer-facing experience must have its own identity, access, data and commercial boundaries; it is not part of the current internal discovery scope.

---

*AtlasHub — Augmented Enterprise · Unified Intelligence*

## Temporary living standby screen (v1.0.0)

The root web page is a text-free, fullscreen black Earth/cosmos and live particles scene while the Command Center is being developed. It has no authentication, operational data, analytics or service calls. Source: Atlas Brand System / Atlas Motion (shared/motion/living-background). See [provenance](docs/living-background-provenance.json). Open public/index.html locally or import this repository into Vercel with Framework **Other**, root `.` and output `public`, no install/build command or environment variables required. Space toggles motion; OS reduced motion takes precedence; F11 browser fullscreen. The project architecture above remains unchanged. No domain is configured by this commit.
