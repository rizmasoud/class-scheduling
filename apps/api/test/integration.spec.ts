import { describe, it, expect, beforeAll, afterAll } from 'vitest';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-do-not-use-in-production-32-chars-long';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '../src/infrastructure/database/schema';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import * as argon2 from 'argon2';
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Roles } from '../src/common/decorators/roles.decorator';

// Dummy controller to test RBAC
@Controller('test')
class TestController {
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Supervisor')
  @Get('supervisor-only')
  getSupervisor() {
    return 'supervisor success';
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Teacher')
  @Get('teacher-only')
  getTeacher() {
    return 'teacher success';
  }
}

describe('Phase 4.2 Integration Tests', () => {
  let app: INestApplication;
  let client: PGlite;
  let db: any;
  let authService: AuthService;
  let usersService: UsersService;

  beforeAll(async () => {
    // 1. Init PGlite (actual PostgreSQL instance compiled to WASM)
    client = new PGlite();
    db = drizzle(client, { schema });

    // 2. Run migrations
    await migrate(db, { migrationsFolder: require('path').resolve(__dirname, '../../../drizzle') });

    // Seed test users
    const passwordHash = await argon2.hash('password123');
    const [supervisor] = await db.insert(schema.users).values({
      username: 'supervisor1',
      passwordHash,
      role: 'Supervisor',
    }).returning();

    const [teacher] = await db.insert(schema.users).values({
      username: 'teacher1',
      passwordHash,
      role: 'Teacher',
    }).returning();

    await db.insert(schema.supervisors).values({
      userId: supervisor.id,
      fullName: 'Super Visor',
    });

    await db.insert(schema.teachers).values({
      userId: teacher.id,
      fullName: 'Teach Er',
      baseRatePerSession: 5000,
    });

    // 3. Boot NestJS with the test database
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestController],
    })
    .overrideProvider('PG_CONNECTION')
    .useValue(db)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
  });

  afterAll(async () => {
    await app.close();
    await client.close();
  });

  describe('DATABASE', () => {
    it('migration applies successfully to a clean PostgreSQL database', async () => {
      // If we got here, migrations didn't throw
      const result = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
      const tableNames = result.rows.map((r: any) => r.table_name);
      
      expect(tableNames).toContain('academic_terms');
      expect(tableNames).toContain('system_settings');
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('supervisors');
      expect(tableNames).toContain('teachers');
      expect(tableNames).toContain('user_sessions');
      expect(tableNames).toContain('audit_logs');
    });

    it('core foreign keys/constraints work', async () => {
      // Try to insert a teacher with non-existent user_id
      await expect(
        db.insert(schema.teachers).values({
          userId: '00000000-0000-0000-0000-000000000000',
          fullName: 'Invalid',
        })
      ).rejects.toThrow();
    });

    it('audit_logs INSERT works', async () => {
      const [log] = await db.insert(schema.auditLogs).values({
        tableName: 'test',
        recordId: '00000000-0000-0000-0000-000000000000',
        action: 'INSERT',
      }).returning();
      expect(log.id).toBeDefined();
    });

    it('audit_logs UPDATE fails', async () => {
      const [log] = await db.select().from(schema.auditLogs).limit(1);
      await expect(
        db.update(schema.auditLogs).set({ action: 'UPDATE' }).where(eq(schema.auditLogs.id, log.id))
      ).rejects.toThrow(/audit_logs is append-only/);
    });

    it('audit_logs DELETE fails', async () => {
      const [log] = await db.select().from(schema.auditLogs).limit(1);
      await expect(
        db.delete(schema.auditLogs).where(eq(schema.auditLogs.id, log.id))
      ).rejects.toThrow(/audit_logs is append-only/);
    });
  });

  describe('AUTH', () => {
    it('valid login succeeds', async () => {
      const user = await authService.validateUser('supervisor1', 'password123');
      expect(user).toBeDefined();
      expect(user.username).toBe('supervisor1');
    });

    it('invalid credentials fail', async () => {
      const user = await authService.validateUser('supervisor1', 'wrong');
      expect(user).toBeNull();
    });

    it('password is not stored plaintext', async () => {
      const dbUser = await usersService.findByUsername('supervisor1');
      expect(dbUser.passwordHash).not.toBe('password123');
      expect(dbUser.passwordHash).toMatch(/^\$argon2/);
    });

    it('refresh flow works and rotates token', async () => {
      const user = await authService.validateUser('supervisor1', 'password123');
      const tokens = await authService.login(user);
      
      const newTokens = await authService.refresh(tokens.refresh_token);
      expect(newTokens.access_token).toBeDefined();
      expect(newTokens.refresh_token).toBeDefined();
      expect(newTokens.refresh_token).not.toBe(tokens.refresh_token);

      // Old refresh token must now be revoked/rejected (rotation enforcement)
      await expect(authService.refresh(tokens.refresh_token)).rejects.toThrow();

      // New rotated refresh token works
      const rotatedAgain = await authService.refresh(newTokens.refresh_token);
      expect(rotatedAgain.access_token).toBeDefined();
      expect(rotatedAgain.refresh_token).not.toBe(newTokens.refresh_token);
    });

    it('refresh token is stored hashed in user_sessions, never in plaintext', async () => {
      const user = await authService.validateUser('supervisor1', 'password123');
      const tokens = await authService.login(user);
      
      // Query raw database sessions
      const sessions = await db.select().from(schema.userSessions).where(eq(schema.userSessions.userId, user.id));
      const rawMatches = sessions.filter((s: any) => s.refreshToken === tokens.refresh_token);
      expect(rawMatches.length).toBe(0);

      // Verify the stored hash is a 64-char SHA-256 hex string
      const latestSession = sessions[sessions.length - 1];
      expect(latestSession.refreshToken).toMatch(/^[a-f0-9]{64}$/);
    });

    it('logout/revocation prevents further refresh', async () => {
      const user = await authService.validateUser('supervisor1', 'password123');
      const tokens = await authService.login(user);
      
      await authService.logout(tokens.refresh_token);
      
      await expect(authService.refresh(tokens.refresh_token)).rejects.toThrow();
    });
  });

  describe('RBAC', () => {
    let superToken: string;
    let teacherToken: string;
    
    beforeAll(async () => {
      const u1 = await authService.validateUser('supervisor1', 'password123');
      superToken = (await authService.login(u1)).access_token;
      
      const u2 = await authService.validateUser('teacher1', 'password123');
      teacherToken = (await authService.login(u2)).access_token;
    });

    it('Supervisor role passes Supervisor-protected access', async () => {
      const http = app.getHttpServer();
      const res = await require('supertest')(http)
        .get('/test/supervisor-only')
        .set('Authorization', `Bearer ${superToken}`);
      
      expect(res.status).toBe(200);
      expect(res.text).toBe('supervisor success');
    });

    it('Teacher role is rejected from Supervisor-only access', async () => {
      const http = app.getHttpServer();
      const res = await require('supertest')(http)
        .get('/test/supervisor-only')
        .set('Authorization', `Bearer ${teacherToken}`);
      
      expect(res.status).toBe(403);
    });

    it('Teacher-protected access works for Teacher', async () => {
      const http = app.getHttpServer();
      const res = await require('supertest')(http)
        .get('/test/teacher-only')
        .set('Authorization', `Bearer ${teacherToken}`);
      
      expect(res.status).toBe(200);
      expect(res.text).toBe('teacher success');
    });

    it('unauthenticated access is rejected', async () => {
      const http = app.getHttpServer();
      const res = await require('supertest')(http)
        .get('/test/supervisor-only');
      
      expect(res.status).toBe(401);
    });

    it('RolesGuard safely handles missing user without HTTP 500 TypeError crash', () => {
      const reflectorMock = {
        getAllAndOverride: () => ['Supervisor'],
      } as any;
      const guard = new RolesGuard(reflectorMock);
      const contextMock = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: undefined }),
        }),
      } as any;

      expect(() => guard.canActivate(contextMock)).toThrow();
    });
  });
});
