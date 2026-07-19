# Database Conventions (Drizzle ORM + SQLite)

This document outlines the standard conventions for creating and managing the Drizzle ORM database schema in this project. All new entities must strictly adhere to these rules to ensure maintainability, scalability, and consistency.

## 1. Table Naming
- **Convention:** Use **plural, snake_case** for all table names in the database, and **camelCase** for the exported TypeScript variable.
- **Example:**
  ```typescript
  export const teacherSkills = sqliteTable('teacher_skills', { ... });
  ```

## 2. Column Naming
- **Convention:** Use **snake_case** for the actual database column names, but **camelCase** for the Drizzle schema object keys. This allows clean integration with TypeScript code while maintaining standard SQL conventions.
- **Example:**
  ```typescript
  fullName: text('full_name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  ```

## 3. Primary Keys
- **Convention:** Every table MUST have a primary key named `id`.
- **Type:** Primary keys must be UUIDs stored as `text`.
- **Example:**
  ```typescript
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ```

## 4. Foreign Keys
- **Convention:** Foreign key columns should be named `${singular_parent_entity}_id` (e.g., `student_id`).
- **Constraint:** Use the `.references()` method inline. Since the project uses **Soft Deletes**, avoid `onDelete('cascade')` unless explicitly required for join tables that hold no historical value.
- **Example:**
  ```typescript
  classId: text('class_id').notNull().references(() => classes.id),
  ```

## 5. Indexes
- **Convention:** Create indexes for foreign keys and frequently searched columns (e.g., `full_name`).
- **Implementation:** Define indexes in the third argument of the table definition using the `index()` function.
- **Naming:** Format as `${table_name}_${column_name}_idx`.
- **Example:**
  ```typescript
  (table) => ({
    classIdx: index('students_class_id_idx').on(table.classId),
  })
  ```

## 6. Unique Constraints
- **Convention:** Use the `.unique()` method inline for single-column unique constraints. For multi-column unique constraints, define them in the third argument of the table definition using `unique()`.
- **Example (Multi-column):**
  ```typescript
  (table) => ({
    unq: unique('teacher_skill_unq').on(table.teacherId, table.bookSegmentId),
  })
  ```

## 7. Nullable Columns
- **Convention:** Columns are nullable by default in Drizzle. You MUST explicitly add `.notNull()` to every column that is required. 
- **Exception:** Only omit `.notNull()` if the domain model explicitly states the field is optional (e.g., `notes`).

## 8. Timestamp Usage
- **Convention:** Every primary table must include standard timestamp tracking.
- **Implementation:** Spread the shared `timestamps` object from `base.schema.ts` at the end of the table definition.
- **Example:**
  ```typescript
  ...timestamps,
  deletedAt: text('deleted_at'), // For soft deletes
  ```

## 9. Relations
- **Convention:** Define Drizzle relations using the `relations()` function in the same file as the table definition.
- **Naming:** Use **plural** names for one-to-many/many-to-many relations (e.g., `students`), and **singular** names for one-to-one/many-to-one relations (e.g., `class`).
- **Example:**
  ```typescript
  export const classesRelations = relations(classes, ({ one, many }) => ({
    teacher: one(teachers, {
      fields: [classes.teacherId],
      references: [teachers.id],
    }),
    students: many(classStudents),
  }));
  ```

## 10. Enum Usage
- **Convention:** SQLite does not have native ENUM types. Store enums as `text` in the database.
- **Implementation:** Restrict the TypeScript type by explicitly typing the Drizzle `.default()` or by relying on Zod validation at the Application layer. Map them to the shared enums defined in `enums.ts`.
- **Example:**
  ```typescript
  status: text('status').$type<ClassStatus>().notNull().default(ClassStatus.Draft),
  ```

## 11. Default Values
- **Convention:** Provide `.default()` values for state flags, booleans, and timestamps.
- **Booleans:** Always use `.default(true)` or `.default(false)`. Do not leave boolean columns nullable.
- **Timestamps:** Handled by the `timestamps` snippet.

## 12. File Naming
- **Convention:** Name schema files using the **plural** name of the entity, followed by `.schema.ts`.
- **Examples:**
  - `students.schema.ts`
  - `classes.schema.ts`
  - `teacher-skills.schema.ts`

## 13. Export Conventions
- **Convention:** Export the table definition, relations definition, and inferred types from the entity's schema file.
- **Index:** Re-export everything from `src/core/database/schema/index.ts`.
- **Example:**
  ```typescript
  export type Student = typeof students.$inferSelect;
  export type InsertStudent = typeof students.$inferInsert;
  ```
