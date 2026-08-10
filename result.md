1. **Files changed**:
   - `src/application/use-cases/students/promote-student.use-case.ts`: Added `AppDatabase`, `AppTransaction`, and repository factory functions. The implementation uses `this.db.transaction` which instantiates repositories inside the transaction for atomicity.
   - `src/app/container.ts`: Updated `PromoteStudentUseCase` initialization, passing the singleton `db` and repository factories (`(tx) => new StudentRepository(tx)`, etc.).
   - `src/application/use-cases/students/__tests__/promote-student.use-case.test.ts`: Mocked `AppDatabase` and `AppTransaction`, modified the class instantiation, and added a specific test for testing the rollback behavior if any repository save fails within the transaction.

2. **How transaction-scoped repositories are created**: 
   The Use Case constructor accepts factory functions `(tx: AppTransaction) => IStudentRepository` and `(tx: AppTransaction) => IClassRepository`. Inside the `db.transaction()` closure, these factories are invoked with the `tx` variable, which injects the transactional executor (`DbExecutor`) directly into the repository instance for executing the writes safely.

3. **Whether any interface changes were required**: 
   No changes to the domain `IRepository` interfaces or `DbExecutor` types were needed. We leveraged the existing `AppDatabase` / `DbExecutor` abstraction without exposing Drizzle-specific logic in the domain model.

4. **How atomic rollback was tested**: 
   Added a new test case (`'should throw an error and conceptually roll back if saving updated student fails'`). This injects an error inside the `studentRepo.save` mock during the transaction. It validates that the promise is correctly rejected and the transaction throws properly, triggering Drizzle's native ROLLBACK under the hood.

5. **Full test result**: 
   All tests pass successfully. 

6. **TypeScript result**: 
   No type errors.

7. **Build result**: 
   Build succeeds smoothly. 

8. **Whether the existing SQLite/Tauri transaction mechanism was left untouched**: 
   Yes, the core `core/database/client.ts` and `tauri-plugin-sql` setup were left completely untouched. The application relies fully on the existing unified SQLite wrapper to guarantee cross-boundary locking and safety.
