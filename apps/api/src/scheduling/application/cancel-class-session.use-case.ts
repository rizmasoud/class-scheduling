import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PG_CONNECTION } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

@Injectable()
export class CancelClassSessionUseCase {
  constructor(
    @Inject(PG_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async execute(sessionId: string, supervisorUserId?: string) {
    return await this.db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(schema.classSessions)
        .where(eq(schema.classSessions.id, sessionId))
        .for('update');

      if (!session) {
        throw new NotFoundException('Class session not found');
      }

      const oldStatus = session.status;
      if (oldStatus !== 'Cancelled') {
        await tx
          .update(schema.classSessions)
          .set({ status: 'Cancelled' })
          .where(eq(schema.classSessions.id, sessionId));

        await tx.insert(schema.auditLogs).values({
          id: randomUUID(),
          tableName: 'class_sessions',
          recordId: sessionId,
          action: 'CANCEL_SESSION',
          changedBy: supervisorUserId || null,
          oldData: { status: oldStatus },
          newData: { status: 'Cancelled', cancelledAt: new Date().toISOString() },
        });
      }

      const [updated] = await tx
        .select()
        .from(schema.classSessions)
        .where(eq(schema.classSessions.id, sessionId));

      return updated;
    });
  }
}
