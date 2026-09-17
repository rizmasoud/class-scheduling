import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "../../infrastructure/database/database.module";
import * as schema from "../../infrastructure/database/schema";
import { eq, inArray } from "drizzle-orm";
import { canEditLessonPlan } from "@class-scheduling/domain";

export interface SaveLessonPlanCommand {
  classId: string;
  user: {
    userId: string;
    username: string;
    role: string;
    teacherId?: string;
  };
  title?: string;
  notes?: string;
  entries: {
    sessionId: string;
    syllabusItemId?: string | null;
    plannedTopics?: string | null;
    homeworkAssigned?: string | null;
    actualTaughtNotes?: string | null;
  }[];
}

@Injectable()
export class SaveLessonPlanUseCase {
  constructor(
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(command: SaveLessonPlanCommand) {
    const { classId, user, title, notes, entries } = command;

    const cls = await this.db.query.classes.findFirst({
      where: eq(schema.classes.id, classId),
    });

    if (!cls) {
      throw new NotFoundException("Class not found");
    }

    const editCheck = canEditLessonPlan({
      userRole: user.role,
      userTeacherId: user.teacherId,
      classTeacherId: cls.teacherId,
    });

    if (!editCheck.allowed) {
      throw new ForbiddenException(editCheck.reason || "Not authorized to edit lesson plan");
    }

    const classSessions = await this.db.query.classSessions.findMany({
      where: eq(schema.classSessions.classId, classId),
    });
    const validSessionIds = new Set(classSessions.map((s) => s.id));

    for (const entry of entries) {
      if (!validSessionIds.has(entry.sessionId)) {
        throw new BadRequestException(`Session ${entry.sessionId} does not belong to class ${classId}`);
      }
    }

    if (entries.some((e) => e.syllabusItemId)) {
      const bookSyllabus = await this.db.query.bookSyllabusItems.findMany({
        where: eq(schema.bookSyllabusItems.bookId, cls.bookId),
      });
      const validSyllabusIds = new Set(bookSyllabus.map((s) => s.id));

      for (const entry of entries) {
        if (entry.syllabusItemId && !validSyllabusIds.has(entry.syllabusItemId)) {
          throw new BadRequestException(
            `Syllabus item ${entry.syllabusItemId} does not belong to the book assigned to this class`,
          );
        }
      }
    }

    return await this.db.transaction(async (tx) => {
      let existingPlan = await tx.query.lessonPlans.findFirst({
        where: eq(schema.lessonPlans.classId, classId),
      });

      let planId: string;
      const isNew = !existingPlan;
      const effectiveTeacherId = cls.teacherId || user.teacherId;

      if (!effectiveTeacherId) {
        throw new BadRequestException("A class must have an assigned teacher to create a lesson plan");
      }

      if (isNew) {
        const [insertedPlan] = await tx
          .insert(schema.lessonPlans)
          .values({
            classId,
            teacherId: effectiveTeacherId,
            title: title || `${cls.name} Lesson Plan`,
            notes: notes || null,
          })
          .returning();
        planId = insertedPlan.id;

        await tx.insert(schema.auditLogs).values({
          tableName: "lesson_plans",
          recordId: planId,
          action: "CREATE_LESSON_PLAN",
          changedBy: user.userId,
          oldData: null,
          newData: insertedPlan,
        });
      } else {
        planId = existingPlan!.id;
        const [updatedPlan] = await tx
          .update(schema.lessonPlans)
          .set({
            title: title !== undefined ? title : existingPlan!.title,
            notes: notes !== undefined ? notes : existingPlan!.notes,
            updatedAt: new Date(),
          })
          .where(eq(schema.lessonPlans.id, planId))
          .returning();

        await tx.insert(schema.auditLogs).values({
          tableName: "lesson_plans",
          recordId: planId,
          action: "UPDATE_LESSON_PLAN",
          changedBy: user.userId,
          oldData: existingPlan,
          newData: updatedPlan,
        });
      }

      for (const entry of entries) {
        const existingEntry = await tx.query.sessionLessonPlanEntries.findFirst({
          where: eq(schema.sessionLessonPlanEntries.sessionId, entry.sessionId),
        });

        if (existingEntry) {
          const [updatedEntry] = await tx
            .update(schema.sessionLessonPlanEntries)
            .set({
              syllabusItemId:
                entry.syllabusItemId !== undefined ? entry.syllabusItemId : existingEntry.syllabusItemId,
              plannedTopics:
                entry.plannedTopics !== undefined ? entry.plannedTopics : existingEntry.plannedTopics,
              homeworkAssigned:
                entry.homeworkAssigned !== undefined
                  ? entry.homeworkAssigned
                  : existingEntry.homeworkAssigned,
              actualTaughtNotes:
                entry.actualTaughtNotes !== undefined
                  ? entry.actualTaughtNotes
                  : existingEntry.actualTaughtNotes,
              updatedAt: new Date(),
            })
            .where(eq(schema.sessionLessonPlanEntries.id, existingEntry.id))
            .returning();

          await tx.insert(schema.auditLogs).values({
            tableName: "session_lesson_plan_entries",
            recordId: existingEntry.id,
            action: "UPDATE_SESSION_LESSON_PLAN_ENTRY",
            changedBy: user.userId,
            oldData: existingEntry,
            newData: updatedEntry,
          });
        } else {
          const [insertedEntry] = await tx
            .insert(schema.sessionLessonPlanEntries)
            .values({
              lessonPlanId: planId,
              sessionId: entry.sessionId,
              syllabusItemId: entry.syllabusItemId || null,
              plannedTopics: entry.plannedTopics || null,
              homeworkAssigned: entry.homeworkAssigned || null,
              actualTaughtNotes: entry.actualTaughtNotes || null,
            })
            .returning();

          await tx.insert(schema.auditLogs).values({
            tableName: "session_lesson_plan_entries",
            recordId: insertedEntry.id,
            action: "CREATE_SESSION_LESSON_PLAN_ENTRY",
            changedBy: user.userId,
            oldData: null,
            newData: insertedEntry,
          });
        }
      }

      return {
        success: true,
        planId,
      };
    });
  }
}
