import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PG_CONNECTION } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class ListClassesUseCase {
  constructor(
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(userRole: string, teacherId?: string, termId?: string) {
    let whereCondition = undefined;
    const conditions = [];

    if (userRole === 'Teacher') {
      if (!teacherId) return [];
      conditions.push(eq(schema.classes.teacherId, teacherId));
    }

    if (termId) {
      conditions.push(eq(schema.classes.termId, termId));
    }

    if (conditions.length > 0) {
      whereCondition = and(...conditions);
    }

    const classes = await this.db.query.classes.findMany({
      where: whereCondition,
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    });

    return classes;
  }
}
