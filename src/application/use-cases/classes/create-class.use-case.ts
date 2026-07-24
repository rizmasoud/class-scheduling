import { Class, ClassId, ClassScheduleId, BookId, TeacherId, ClassStatus, WeekDay } from '@/domain/models';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

export interface CreateClassScheduleDTO {
  weekDay: WeekDay;
  startTime: string;
  endTime: string;
}

export interface CreateClassDTO {
  name: string;
  bookId: BookId;
  teacherId?: TeacherId | null;
  status: ClassStatus;
  minCapacity: number;
  targetCapacity: number;
  maxCapacity: number;
  notes?: string | null;
  schedules?: CreateClassScheduleDTO[] | null;
}

export class CreateClassUseCase {
  constructor(private readonly classRepository: IClassRepository) {}

  async execute(dto: CreateClassDTO): Promise<Class> {
    const classId = crypto.randomUUID() as ClassId;
    
    const classData: Class = {
      id: classId,
      name: dto.name,
      bookId: dto.bookId,
      teacherId: dto.teacherId ?? null,
      status: dto.status,
      minCapacity: dto.minCapacity,
      targetCapacity: dto.targetCapacity,
      maxCapacity: dto.maxCapacity,
      notes: dto.notes ?? null,
      schedules: dto.schedules ? dto.schedules.map(schedule => ({
        id: crypto.randomUUID() as ClassScheduleId,
        classId,
        weekDay: schedule.weekDay,
        startTime: schedule.startTime,
        endTime: schedule.endTime
      })) : [],
      enrollments: [],
    };
    
    return this.classRepository.save(classData);
  }
}
