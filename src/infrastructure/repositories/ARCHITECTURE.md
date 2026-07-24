# Repository Architecture (FROZEN)

This document outlines the final, frozen architecture for the Infrastructure Repository layer. It strictly separates Domain interfaces from database persistence using Drizzle ORM.

## 1. Responsibilities & Abstraction Levels

### BaseRepository (Generic Abstract Class)
The `BaseRepository` provides a reusable, low-level persistence implementation for single tables.
- **Responsibility:** Executes primitive Drizzle ORM operations for a single entity table.
- **Constraint:** Completely unaware of Domain models, Aggregates, Business Rules, Mappers, Transactions, and "active" vs "inactive" semantics.
- **Behavior:** It is an implementation reuse mechanism, not just a contract. It provides concrete database access.

### Concrete Repositories (e.g., `BookRepository`, `TeacherRepository`)
Concrete repositories implement the Domain repository interfaces (e.g., `IBookRepository`) and manage full aggregates.
- **Responsibility:** Orchestrating persistence workflows, managing transactions, executing aggregate-level queries (joins), mapping between Domain and Persistence models.
- **Constraint:** The only layer allowed to decide whether an aggregate requires an `insert()` or an `update()`. BaseRepository never makes this decision.
- **Mapper Integration:** Each Concrete Repository owns its specific Mapper (e.g., `TeacherRepository` uses `TeacherMapper`). Mappers are NEVER injected into the `BaseRepository`.

---

## 2. BaseRepository Public API (Primitive Persistence)

The `BaseRepository` is defined as an abstract class (or concrete generic class) exposing ONLY primitive persistence operations.

```typescript
abstract class BaseRepository<TEntity, TInsert> {
  // Read Operations
  async findById(id: string): Promise<TEntity | null>;
  async findMany(ids: readonly string[]): Promise<readonly TEntity[]>;
  async findAll(): Promise<readonly TEntity[]>;

  // Write Operations
  async insert(entity: TInsert): Promise<TEntity>;
  async update(id: string, entity: TInsert): Promise<TEntity>; // No Partial updates
  
  // Deletion Operations
  async softDelete(id: string): Promise<void>;
}
```

*Note: Update receives complete persistence models (`TInsert`), not `Partial<TInsert>`. If partial updates are required for specific domain rules, they must be implemented entirely within the Concrete Repository.*

---

## 3. Dependency Flow & Mapping

**Domain Model → Concrete Repository → BaseRepository → Drizzle**

1. **Mapping Ownership:** Concrete repositories own mapping. They translate Domain Aggregates into Persistence records using explicit Mapper objects.
2. **Persistence Invocation:** After mapping, the Concrete Repository calls the primitive methods on `BaseRepository` (e.g., `insert` or `update`) or executes custom Drizzle logic for child entities and joins.
3. **Domain Independence:** The Domain remains entirely isolated. It calls `.save()` and `.archive()`, oblivious to whether the record is inserted, updated, or soft-deleted.

---

## 4. Architectural Rules (Strict)

1. **Explicit Insert/Update Decision:** The Concrete Repository is the **only layer** allowed to decide whether an aggregate should call `insert()` or `update()`. `BaseRepository` never makes that decision.
2. **Encapsulation of ORM Primitives:** `BaseRepository` must **never expose** Drizzle query builders, SQL operators, or ORM-specific primitives outside itself. Concrete repositories interact only through the `BaseRepository` API or execute their own aggregate queries internally.
3. **No Mappers in Base:** The `BaseRepository` must not receive a Mapper through constructor injection.
4. **No active() filtering in Base:** Any logic checking for "active" vs "inactive" semantics belongs inside concrete repositories.
5. **Soft Delete Translation:** The Domain language uses `archive()`. The Infrastructure performs `softDelete()` internally. Concrete repositories translate `archive()` → `softDelete()`.
6. **No Structural Additions:** No Specification Pattern, Query Objects, Unit of Work, or Repository Factories. Keep the architecture simple and pragmatic.

---

## 5. Implementation Plan

1. **Step 1:** Implement the abstract `BaseRepository` according to the API above.
2. **Step 2:** Implement the simplest concrete repository (e.g., `BookRepository`) extending `BaseRepository` and implementing `IBookRepository`.
3. **Step 3:** Implement aggregate-heavy repositories (e.g., `TeacherRepository`, `ClassRepository`) handling their child entities inside their `save()` orchestration.
4. **Step 4:** Integrate transactional contexts once the primitive layers are validated.
