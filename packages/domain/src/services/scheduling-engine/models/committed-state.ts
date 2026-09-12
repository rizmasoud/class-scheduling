import { TeacherId, StudentId } from '../../../models';
import { ClassCandidate } from './class-candidate';
import { TimeSlot } from './time-slot';

export interface CommittedState {
  readonly acceptedClasses: readonly ClassCandidate[];
  readonly acceptedTeachers: readonly TeacherId[];
  readonly acceptedStudents: readonly StudentId[];
  readonly acceptedTimeSlots: readonly TimeSlot[];
}
