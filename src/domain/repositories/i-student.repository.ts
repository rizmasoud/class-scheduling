import { Student, StudentId } from '@/domain/models';

export interface IStudentRepository {
  findById(id: StudentId): Promise<Student | null>;
  findAll(): Promise<readonly Student[]>;
  findAllActive(): Promise<readonly Student[]>;
  findMany(ids: readonly StudentId[]): Promise<readonly Student[]>;
  save(student: Student): Promise<Student>;
  archive(id: StudentId): Promise<void>;
}
