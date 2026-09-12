# Apps / Web (Next.js Frontend Boundary)

This directory represents the isolated frontend application boundary for the web migration.

## Architectural Constraints:
- **Framework**: Next.js (App Router), React, Tailwind CSS, TanStack Query.
- **Role**: Client-side presentation, routing, forms, and optimistic UI state.
- **Data Access**: Strictly communicates via HTTP REST API to `apps/api`.
- **PROHIBITIONS**:
  - Zero direct access to PostgreSQL, Drizzle ORM, SQLite, or backend repositories.
  - Zero imports from `@tauri-apps/*` or desktop native bridges.
  - Zero business logic or database transaction management.
