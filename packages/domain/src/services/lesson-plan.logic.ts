import { ClassSessionId, TeacherId, BookSyllabusItemId } from "../models";

export interface CanAccessLessonPlanParams {
  userRole: "Supervisor" | "Teacher" | string;
  userTeacherId?: TeacherId | null;
  classTeacherId: TeacherId | null;
  session?: {
    id: ClassSessionId;
    scheduledTeacherId: TeacherId | null;
    actualTeacherId: TeacherId | null;
  };
  approvedSubstituteTeacherIds?: TeacherId[];
}

export interface CanEditLessonPlanParams {
  userRole: "Supervisor" | "Teacher" | string;
  userTeacherId?: TeacherId | null;
  classTeacherId: TeacherId | null;
}

export function canViewLessonPlan(params: CanAccessLessonPlanParams): { allowed: boolean; reason?: string } {
  const { userRole, userTeacherId, classTeacherId, session, approvedSubstituteTeacherIds = [] } = params;

  if (userRole === "Supervisor") {
    return { allowed: true };
  }

  if (userRole === "Teacher") {
    if (!userTeacherId) {
      return { allowed: false, reason: "Teacher ID required" };
    }

    if (classTeacherId && userTeacherId === classTeacherId) {
      return { allowed: true };
    }

    if (session) {
      if (session.actualTeacherId === userTeacherId) {
        return { allowed: true };
      }
      if (approvedSubstituteTeacherIds.includes(userTeacherId)) {
        return { allowed: true };
      }
    }

    return { allowed: false, reason: "Not authorized to view this lesson plan" };
  }

  return { allowed: false, reason: "Unauthorized role" };
}

export function canEditLessonPlan(params: CanEditLessonPlanParams): { allowed: boolean; reason?: string } {
  const { userRole, userTeacherId, classTeacherId } = params;

  if (userRole === "Supervisor") {
    return { allowed: true };
  }

  if (userRole === "Teacher") {
    if (!userTeacherId) {
      return { allowed: false, reason: "Teacher ID required" };
    }
    if (classTeacherId && userTeacherId === classTeacherId) {
      return { allowed: true };
    }
    return { allowed: false, reason: "Teachers may only edit lesson plans for classes they teach" };
  }

  return { allowed: false, reason: "Unauthorized role" };
}

export function computeSyllabusProgress(
  syllabusItems: { id: BookSyllabusItemId; sessionNumber: number; topic: string }[],
  planEntries: { sessionId: string; syllabusItemId: BookSyllabusItemId | null }[]
): {
  totalItems: number;
  coveredItemsCount: number;
  coveragePercentage: number;
  itemCoverage: {
    syllabusItemId: BookSyllabusItemId;
    topic: string;
    coveredCount: number;
    isCovered: boolean;
  }[];
} {
  const coveredCounts: Record<string, number> = {};
  for (const entry of planEntries) {
    if (entry.syllabusItemId) {
      coveredCounts[entry.syllabusItemId] = (coveredCounts[entry.syllabusItemId] || 0) + 1;
    }
  }

  const itemCoverage = syllabusItems.map((item) => {
    const count = coveredCounts[item.id] || 0;
    return {
      syllabusItemId: item.id,
      topic: item.topic,
      coveredCount: count,
      isCovered: count > 0,
    };
  });

  const coveredItemsCount = itemCoverage.filter((i) => i.isCovered).length;
  const totalItems = syllabusItems.length;
  const coveragePercentage = totalItems === 0 ? 100 : Math.round((coveredItemsCount / totalItems) * 100);

  return {
    totalItems,
    coveredItemsCount,
    coveragePercentage,
    itemCoverage,
  };
}
