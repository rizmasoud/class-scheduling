import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PG_CONNECTION } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { eq, or } from 'drizzle-orm';

@Injectable()
export class GetClassSessionUseCase {
  constructor(
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(sessionId: string, userRole: string, teacherId?: string) {
    const session = await this.db.query.classSessions.findFirst({
      where: eq(schema.classSessions.id, sessionId)
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (userRole === 'Teacher' && session.scheduledTeacherId !== teacherId && session.actualTeacherId !== teacherId) {
      throw new NotFoundException('Session not found'); // Hide unauthorized sessions
    }

    return session;
  }
}
