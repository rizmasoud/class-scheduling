# Infrastructure Foundation Architecture (Drizzle + SQLite)

This document outlines the foundation layer for repository implementation. It defines how database instances, transactions, and repository construction will be handled without introducing heavy abstractions like Unit of Work (UoW), Service Locators, or Dependency Injection (DI) frameworks.

## 1. Folder Structure

The infrastructure foundation will be organized as follows:

```text
src/
├── core/
│   └── database/
│       ├── index.ts           # Configures and exports the global `db` singleton
│       ├── types.ts           # Defines the `DbExecutor` type union (db | tx)
│       └── schema/            # Drizzle table schemas
├── infrastructure/
│   └── repositories/
│       ├── INFRASTRUCTURE_FOUNDATION.md
│       ├── ARCHITECTURE.md
│       ├── base.repository.ts # Abstract base class utilizing DbExecutor
│       ├── book.repository.ts # Concrete repository implementing IBookRepository
│       └── ...
```

## 2. Responsibilities

- **`core/database/index.ts`**: Owns the setup of the SQLite connection and Drizzle ORM instance. It is the only place that knows about the physical database connection details (Tauri/SQLite bindings).
- **`DbExecutor` Type**: Abstracts the execution context. It represents an interface that both the main Drizzle `db` instance and a Drizzle `tx` (transaction) instance satisfy.
- **`BaseRepository`**: Receives a `DbExecutor` and a specific Drizzle table, executing primitive queries against them.
- **Concrete Repositories**: Receive a `DbExecutor`, pass it to `super()`, and utilize it for any aggregate-level queries or child entity persistence.

## 3. Dependency Flow

1. **Usecases / Application Services**: Import the global `db` instance from `core/database` and manually instantiate the required repositories, passing `db` as the argument.
2. **Concrete Repositories**: Depend on `DbExecutor` (an abstraction of Drizzle's query runner) and Domain models.
3. **BaseRepository**: Depends on `DbExecutor` and Drizzle table definitions.

*Rule: Repositories NEVER open their own connections. They only act upon the `DbExecutor` provided to them.*

## 4. Constructor Strategy (Dependency Injection without a Framework)

We will use simple **Manual Constructor Injection**. Repositories will take a `DbExecutor` as their first constructor argument.

```typescript
// Concept:
export type DbExecutor = // Type alias capturing both Drizzle db and Drizzle transaction

abstract class BaseRepository<TEntity, TInsert> {
  constructor(
    protected readonly db: DbExecutor,
    protected readonly table: SQLiteTable
  ) {}
}

class BookRepository extends BaseRepository<PersistenceBook, InsertBook> implements IBookRepository {
  constructor(db: DbExecutor) {
    super(db, books);
  }
}
```

Since there is no DI framework or Repository Factory, use cases will manually instantiate repositories when needed:

```typescript
// Inside a Use Case:
const bookRepo = new BookRepository(db);
const result = await bookRepo.findById(id);
```

## 5. Transaction Strategy

Transactions are orchestrated by the layer that knows about the business use case (usually Application Services/Use Cases), NOT by the repositories themselves. Repositories remain oblivious to whether they are running inside a transaction or not.

When a transaction is required, the use case initiates a Drizzle transaction block. Inside the block, it manually constructs the repositories, passing the transaction context (`tx`) instead of the global `db`.

```typescript
// Concept of Transaction Handling:
await db.transaction(async (tx) => {
  // Construct repositories using the transaction executor
  const teacherRepo = new TeacherRepository(tx);
  const classRepo = new ClassRepository(tx);

  // Both repositories now operate within the same atomic transaction
  await teacherRepo.save(teacher);
  await classRepo.save(classData);
});
```

### Why this approach?
- **Zero Abstraction Cost**: It utilizes Drizzle's native transaction closures without forcing a Unit of Work abstraction over it.
- **Agnostic Repositories**: `TeacherRepository` doesn't know it's in a transaction. It just executes queries against the `DbExecutor` it was given.
- **Explicit Scope**: The transaction boundary is explicit and strictly managed by closures, completely avoiding connection leaks or detached entities.

## Next Steps
Once this document is approved, we will begin implementation in the following order:
1. Define `DbExecutor` type in `src/core/database/types.ts`.
2. Implement `BaseRepository` in `src/infrastructure/repositories/base.repository.ts`.
3. Implement `BookRepository` (simplest aggregate).
4. Implement remaining concrete repositories.
----

Repositories must be stateless.