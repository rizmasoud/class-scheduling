# Apps / API (NestJS Backend & Infrastructure Boundary)

This directory represents the isolated backend and infrastructure application boundary.

## Architectural Constraints:
- **Framework**: NestJS REST API, Drizzle ORM, PostgreSQL.
- **Role**: Authentication, RBAC, application orchestrators/services, transaction management, and repository implementations.
- **Data Access**:
  - Drizzle ORM and PostgreSQL drivers are strictly confined to `apps/api/src/infrastructure/`.
  - Controllers and Application Services consume domain interfaces without coupling to SQL schemas.
  - Zero imports from frontend (`apps/web`) or desktop native bridges.
