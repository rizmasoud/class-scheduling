import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import * as schema from '../infrastructure/database/schema';

@Injectable()
export class UsersService {
  constructor(@Inject('PG_CONNECTION') private db: any) {}

  async findByUsername(username: string) {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0] || null;
  }

  async findById(id: string) {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0] || null;
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    await this.db.insert(schema.userSessions).values({
      userId,
      refreshToken: token,
      expiresAt,
    });
  }

  async findSessionByToken(token: string) {
    const result = await this.db.select().from(schema.userSessions).where(eq(schema.userSessions.refreshToken, token));
    return result[0] || null;
  }

  async revokeRefreshToken(token: string) {
    await this.db.update(schema.userSessions)
      .set({ revoked: true })
      .where(eq(schema.userSessions.refreshToken, token));
  }
}
