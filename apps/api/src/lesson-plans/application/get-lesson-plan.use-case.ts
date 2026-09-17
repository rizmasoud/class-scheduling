import { Injectable, Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "../../infrastructure/database/database.module";
import * as schema from "../../infrastructure/database/schema";
import { eq, inArray } from "drizzle-orm";

@Injectable()
export class GetLessonPlanUseCase {
  constructor(
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(classId: string, userRole: string, teacherId?: string) {
    try {
      return await this.executeInternal(classId, userRole, teacherId);
    } catch (err) {
      console.error("ERROR IN GetLessonPlanUseCase:", err);
      throw err;
    }
  }

  private async executeInternal(classId: string, userRole: string, teacherId?: string) {

    const cls = await this.db.query.classes.findFirst({
      where: eq(schema.classes.id, classId),
    });

    if (!cls) {
      throw new NotFoundException("Class not found");
    }

    if (userRole === "Teacher") {
      let isAuthorized = cls.teacherId === teacherId;

      if (!isAuthorized && teacherId) {
        const classSessionsList = await this.db.query.classSessions.findMany({
          where: eq(schema.classSessions.classId, classId),
        });

        const isActualTeacherOnAny = classSessionsList.some(
          (s) => s.actualTeacherId === teacherId,
        );

        if (isActualTeacherOnAny) {
          isAuthorized = true;
        } else if (classSessionsList.length > 0) {
          const sessionIds = classSessionsList.map((s) => s.id);
          const approvedSubs = await this.db.query.substitutionRequests.findMany({
            where: inArray(schema.substitutionRequests.sessionId, sessionIds),
          });

          const hasApprovedSub = approvedSubs.some(
            (sub) =>
              sub.status === "Approved" &&
              (sub.acceptedById === teacherId || sub.requestedSubstituteId === teacherId),
          );

          if (hasApprovedSub) {
            isAuthorized = true;
          }
        }
      }

      if (!isAuthorized) {
        throw new ForbiddenException("Not authorized to view this lesson plan");
      }
    }

    const plan = await this.db.query.lessonPlans.findFirst({
      where: eq(schema.lessonPlans.classId, classId),
    });

    const sessions = await this.db.query.classSessions.findMany({
      where: eq(schema.classSessions.classId, classId),
      orderBy: (s, { asc }) => [asc(s.date), asc(s.startTime)],
    });

    let entries: any[] = [];
    if (plan) {
      entries = await this.db.query.sessionLessonPlanEntries.findMany({
        where: eq(schema.sessionLessonPlanEntries.lessonPlanId, plan.id),
      });
    }

    const syllabusItems = await this.db.query.bookSyllabusItems.findMany({
      where: eq(schema.bookSyllabusItems.bookId, cls.bookId),
    });
    const syllabusMap = new Map(syllabusItems.map((item) => [item.id, item]));

    const enrichedEntries = sessions.map((session, idx) => {
      const entry = entries.find((e) => e.sessionId === session.id);
      const syl = entry?.syllabusItemId ? syllabusMap.get(entry.syllabusItemId) : null;

      return {
        id: entry?.id || `virtual-${session.id}`,
        lessonPlanId: plan?.id || null,
        sessionId: session.id,
        sessionIndex: idx + 1,
        sessionDate: session.date,
        sessionStartTime: session.startTime,
        sessionEndTime: session.endTime,
        sessionStatus: session.status,
        scheduledTeacherId: session.scheduledTeacherId,
        actualTeacherId: session.actualTeacherId,
        syllabusItemId: entry?.syllabusItemId || null,
        syllabusTopic: syl ? syl.topic : null,
        plannedTopics: entry?.plannedTopics || null,
        homeworkAssigned: entry?.homeworkAssigned || null,
        actualTaughtNotes: entry?.actualTaughtNotes || null,
        createdAt: entry?.createdAt || null,
        updatedAt: entry?.updatedAt || null,
      };
    });

    return {
      id: plan?.id || null,
      classId: cls.id,
      className: cls.name,
      bookId: cls.bookId,
      teacherId: cls.teacherId,
      title: plan?.title || `${cls.name} Lesson Plan`,
      notes: plan?.notes || null,
      createdAt: plan?.createdAt || null,
      updatedAt: plan?.updatedAt || null,
      entries: enrichedEntries,
    };
  }
}
