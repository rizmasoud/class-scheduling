import { SchedulingContext } from '@class-scheduling/domain';

export const ISchedulingContextLoader = Symbol('ISchedulingContextLoader');

export interface ISchedulingContextLoader {
  loadContext(termId: string): Promise<SchedulingContext>;
}
