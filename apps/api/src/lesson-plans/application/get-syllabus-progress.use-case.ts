import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "../../infrastructure/database/database.module";
import * as schema from "../../infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { computeSyllabusProgress } from "@class-scheduling/domain";

@Injectable()
export class GetSyllabusProgressUseCase {
  constructor(
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(classId: string) {
    const cls = await this.db.query.classes.findFirst({
      where: eq(schema.classes.id, classId),
    });

    if (!cls) {
      throw new NotFoundException("Class not found");
    }

    const book = await this.db.query.books.findFirst({
      where: eq(schema.books.id, cls.bookId),
    });

    if (!book) {
      throw new NotFoundException("Book not found for class");
    }

    const syllabusItems = await this.db.query.bookSyllabusItems.findMany({
      where: eq(schema.bookSyllabusItems.bookId, cls.bookId),
      orderBy: (s, { asc }) => [asc(s.sessionNumber)],
    });

    const plan = await this.db.query.lessonPlans.findFirst({
      where: eq(schema.lessonPlans.classId, classId),
    });

    let entries: any[] = [];
    if (plan) {
      entries = await this.db.query.sessionLessonPlanEntries.findMany({
        where: eq(schema.sessionLessonPlanEntries.lessonPlanId, plan.id),
      });
    }

    const progress = computeSyllabusProgress(
      syllabusItems.map((item) => ({
        id: item.id,
        sessionNumber: item.sessionNumber,
        topic: item.topic,
      })),
      entries.map((e) => ({
        sessionId: e.sessionId,
        syllabusItemId: e.syllabusItemId,
      })),
    );

    return {
      classId: cls.id,
      className: cls.name,
      bookId: book.id,
      bookTitle: book.title,
      totalSyllabusItems: progress.totalItems,
      coveredItemsCount: progress.coveredItemsCount,
      coveragePercentage: progress.coveragePercentage,
      items: progress.itemCoverage,
    };
  }
}
