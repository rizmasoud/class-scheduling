import { Student, StudentId, StudentPreferenceId, AvailableDayPattern } from '@/domain/models';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';
import { IBookRepository } from '@/domain/repositories/i-book.repository';

export interface ImportStudentRow {
  fullName: string;
  currentBookName: string;
  availableDayPattern: string;
  notes?: string;
}

export interface ImportStudentsResult {
  importedCount: number;
  duplicateCount: number;
  invalidCount: number;
  missingBooksCount: number;
  errors: string[];
  validRows: ImportStudentRow[]; // Return the valid rows so the UI can show them in a preview
}

export class ImportStudentsUseCase {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly bookRepository: IBookRepository
  ) {}

  async execute(rows: ImportStudentRow[], dryRun: boolean): Promise<ImportStudentsResult> {
    const books = await this.bookRepository.findAllActive();
    const students = await this.studentRepository.findAllActive();

    const bookMap = new Map(books.map(b => [b.name.toLowerCase().trim(), b.id]));
    const studentNames = new Set(students.map(s => s.fullName.toLowerCase().trim()));

    const result: ImportStudentsResult = {
      importedCount: 0,
      duplicateCount: 0,
      invalidCount: 0,
      missingBooksCount: 0,
      errors: [],
      validRows: []
    };

    const validStudentsToSave: Student[] = [];

    for (const [index, row] of rows.entries()) {
      const rowNum = index + 1; // 1-indexed

      if (!row.fullName || !row.currentBookName || !row.availableDayPattern) {
        result.invalidCount++;
        result.errors.push(`Row ${rowNum}: Missing required fields (fullName, currentBookName, availableDayPattern)`);
        continue;
      }

      const pattern = row.availableDayPattern.trim();
      if (pattern !== 'Odd' && pattern !== 'Even' && pattern !== 'Both') {
        result.invalidCount++;
        result.errors.push(`Row ${rowNum}: Invalid availableDayPattern '${pattern}'`);
        continue;
      }

      const bookId = bookMap.get(row.currentBookName.toLowerCase().trim());
      if (!bookId) {
        result.missingBooksCount++;
        result.errors.push(`Row ${rowNum}: Book '${row.currentBookName}' not found`);
        continue;
      }

      const normalizedName = row.fullName.toLowerCase().trim();
      if (studentNames.has(normalizedName)) {
        result.duplicateCount++;
        result.errors.push(`Row ${rowNum}: Student '${row.fullName}' already exists (likely duplicate)`);
        continue;
      }

      // Pre-add to set to avoid duplicates within the CSV itself
      studentNames.add(normalizedName);

      const studentId = crypto.randomUUID() as StudentId;
      validStudentsToSave.push({
        id: studentId,
        fullName: row.fullName.trim(),
        currentBookId: bookId,
        notes: row.notes?.trim() || null,
        preference: {
          id: crypto.randomUUID() as StudentPreferenceId,
          studentId: studentId,
          availableDayPattern: pattern as AvailableDayPattern,
          unavailableTimeRanges: null,
          notes: null,
        }
      });
      
      result.validRows.push(row);
    }

    if (!dryRun && validStudentsToSave.length > 0) {
      if (this.studentRepository.saveMany) {
        await this.studentRepository.saveMany(validStudentsToSave);
      } else {
        for (const s of validStudentsToSave) {
          await this.studentRepository.save(s);
        }
      }
      result.importedCount = validStudentsToSave.length;
    }

    return result;
  }
}
