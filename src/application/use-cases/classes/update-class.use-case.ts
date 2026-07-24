import { Class, ClassId, ClassScheduleId, BookId, TeacherId, ClassStatus, WeekDay } from '@/domain/models';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

export interface UpdateClassScheduleDTO {
  id?: ClassScheduleId;
  weekDay: WeekDay;
  startTime: string;
  endTime: string;
}

export interface UpdateClassDTO {
  id: ClassId;
  name?: string;
  bookId?: BookId;
  teacherId?: TeacherId | null;
  status?: ClassStatus;
  minCapacity?: number;
  targetCapacity?: number;
  maxCapacity?: number;
  notes?: string | null;
  schedules?: UpdateClassScheduleDTO[] | null;
}

export class UpdateClassUseCase {
  constructor(private readonly classRepository: IClassRepository) {}

  async execute(dto: UpdateClassDTO): Promise<Class> {
    const existingClass = await this.classRepository.findById(dto.id);
    if (!existingClass) {
      throw new Error(`Class with id ${dto.id} not found`);
    }

    let updatedSchedules = existingClass.schedules;
    if (dto.schedules === null) {
      updatedSchedules = [];
    } else if (dto.schedules) {
      updatedSchedules = dto.schedules.map(schedule => ({
        id: schedule.id ?? (crypto.randomUUID() as ClassScheduleId),
        classId: dto.id,
        weekDay: schedule.weekDay,
        startTime: schedule.startTime,
        endTime: schedule.endTime
      }));
    }

    let updatedTeacherId = existingClass.teacherId;
    if (dto.teacherId !== undefined) {
      updatedTeacherId = dto.teacherId;
    }

    const updatedClass: Class = {
      ...existingClass,
      name: dto.name ?? existingClass.name,
      bookId: dto.bookId ?? existingClass.bookId,
      teacherId: updatedTeacherId,
      status: dto.status ?? existingClass.status,
      minCapacity: dto.minCapacity !== undefined ? dto.minCapacity : existingClass.minCapacity,
      targetCapacity: dto.targetCapacity !== undefined ? dto.targetCapacity : existingClass.targetCapacity,
      maxCapacity: dto.maxCapacity !== undefined ? dto.maxCapacity : existingClass.maxCapacity,
      notes: dto.notes !== undefined ? dto.notes : existingClass.notes,
      schedules: updatedSchedules,
    };

    return this.classRepository.save(updatedClass);
  }
}
