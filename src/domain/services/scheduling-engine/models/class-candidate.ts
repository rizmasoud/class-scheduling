import { TeacherId, BookId, StudentId } from '@/domain/models';
import { TimeSlot } from './time-slot';

export interface ClassCandidate {
  readonly id: string;
  readonly teacherId: TeacherId;
  readonly bookId: BookId;
  readonly studentIds: readonly StudentId[];
  readonly timeSlot: TimeSlot;
}
