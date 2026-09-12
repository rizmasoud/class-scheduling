import { describe, it, expect, beforeAll, afterAll } from 'vitest';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-do-not-use-in-production-32-chars-long';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '../src/infrastructure/database/schema';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import * as argon2 from 'argon2';

describe('Academic Registry Integration', () => {
  let app: INestApplication;
  let client: any;
  let db: any;
  let authService: AuthService;

  let supervisorToken: string;
  let teacherToken1: string;
  let teacherToken2: string;
  let teacherId1: string;
  let teacherId2: string;
  
  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: require('path').resolve(__dirname, '../../../drizzle') });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('PG_CONNECTION')
      .useValue(db)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new (require('@nestjs/common').ValidationPipe)({ whitelist: true }));
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);

    // Setup supervisor
    const hash = await argon2.hash('password123');
    const [supervisorUser] = await db.insert(schema.users).values({
      username: 'supervisor1',
      passwordHash: hash,
      role: 'Supervisor',
    }).returning();
    const supLogin = await authService.login(supervisorUser);
    supervisorToken = supLogin.access_token;

    // Setup two teachers
    const [t1User] = await db.insert(schema.users).values({
      username: 'teacher1',
      passwordHash: hash,
      role: 'Teacher',
    }).returning();
    const [t1] = await db.insert(schema.teachers).values({
      userId: t1User.id,
      fullName: 'Teacher One',
      baseRatePerSession: 5000,
    }).returning();
    teacherId1 = t1.id;
    const t1Login = await authService.login(t1User);
    teacherToken1 = t1Login.access_token;

    const [t2User] = await db.insert(schema.users).values({
      username: 'teacher2',
      passwordHash: hash,
      role: 'Teacher',
    }).returning();
    const [t2] = await db.insert(schema.teachers).values({
      userId: t2User.id,
      fullName: 'Teacher Two',
      baseRatePerSession: 6000,
    }).returning();
    teacherId2 = t2.id;
    const t2Login = await authService.login(t2User);
    teacherToken2 = t2Login.access_token;
  });

  afterAll(async () => {
    await app.close();
    await client.close();
  });

  // ACADEMIC TERMS
  describe('Academic Terms', () => {
    let termId: string;
    it('Supervisor can create academic term', async () => {
      const res = await require('supertest')(app.getHttpServer())
        .post('/academic-terms')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'Fall 2026', startDate: '2026-09-01', endDate: '2026-12-15', status: 'Draft' });
      expect(res.status).toBe(201);
      termId = res.body.id;
    });

    it('Teacher cannot create academic term', async () => {
      const res = await require('supertest')(app.getHttpServer())
        .post('/academic-terms')
        .set('Authorization', `Bearer ${teacherToken1}`)
        .send({ name: 'Winter 2026', startDate: '2026-12-16', endDate: '2027-03-15', status: 'Draft' });
      expect(res.status).toBe(403);
    });
  });

  // BOOKS
  describe('Books & Syllabus', () => {
    let bookId: string;
    it('Supervisor can create a book', async () => {
      const res = await require('supertest')(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ title: 'Book 1', sequenceOrder: 1, sessionCount: 10 });
      expect(res.status).toBe(201);
      bookId = res.body.id;
    });

    it('Teacher cannot create a book', async () => {
      const res = await require('supertest')(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${teacherToken1}`)
        .send({ title: 'Book 2', sequenceOrder: 2, sessionCount: 10 });
      expect(res.status).toBe(403);
    });

    it('Supervisor can manage syllabus items', async () => {
      const res = await require('supertest')(app.getHttpServer())
        .post(`/books/${bookId}/syllabus`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ sessionNumber: 1, topic: 'Intro' });
      expect(res.status).toBe(201);
    });

    it('Teacher cannot create syllabus items', async () => {
      const res = await require('supertest')(app.getHttpServer())
        .post(`/books/${bookId}/syllabus`)
        .set('Authorization', `Bearer ${teacherToken1}`)
        .send({ sessionNumber: 2, topic: 'Advanced' });
      expect(res.status).toBe(403);
    });
  });

  // TEACHER PROFILES
  describe('Teacher Profiles & Skills', () => {
    it('Teacher can update their own notes, but cannot change base rate', async () => {
      const res = await require('supertest')(app.getHttpServer())
        .patch(`/teachers/${teacherId1}`)
        .set('Authorization', `Bearer ${teacherToken1}`)
        .send({ notes: 'My notes' });
      expect(res.status).toBe(200);

      const resFail = await require('supertest')(app.getHttpServer())
        .patch(`/teachers/${teacherId1}`)
        .set('Authorization', `Bearer ${teacherToken1}`)
        .send({ baseRatePerSession: 9000 });
      expect(resFail.status).toBe(403);
    });

    it('Teacher cannot update another teacher profile', async () => {
      const res = await require('supertest')(app.getHttpServer())
        .patch(`/teachers/${teacherId2}`)
        .set('Authorization', `Bearer ${teacherToken1}`)
        .send({ notes: 'Hacked' });
      expect(res.status).toBe(403);
    });
    
    it('Supervisor can update teacher base rate', async () => {
      const res = await require('supertest')(app.getHttpServer())
        .patch(`/teachers/${teacherId1}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ baseRatePerSession: 8000 });
      expect(res.status).toBe(200);
    });
  });

  // STUDENTS
  describe('Students', () => {
    let studentId1: string;
    let studentId2: string;

    it('Two students with identical full_name can coexist', async () => {
      const res1 = await require('supertest')(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ fullName: 'Ali Ahmadi' });
      expect(res1.status).toBe(201);
      studentId1 = res1.body.id;

      const res2 = await require('supertest')(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ fullName: 'Ali Ahmadi' });
      expect(res2.status).toBe(201);
      studentId2 = res2.body.id;

      expect(studentId1).not.toBe(studentId2);
      expect(res1.body.fullName).toBe('Ali Ahmadi');
      expect(res2.body.fullName).toBe('Ali Ahmadi');
    });

    it('external_student_id behavior matches the schema (unique)', async () => {
      const res1 = await require('supertest')(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ fullName: 'Student 3', externalStudentId: 'EXT-123' });
      expect(res1.status).toBe(201);

      const res2 = await require('supertest')(app.getHttpServer())
        .post('/students')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ fullName: 'Student 4', externalStudentId: 'EXT-123' });
      expect(res2.status).toBe(409); // Conflict
    });

    it('Student preferences persist correctly', async () => {
      const res = await require('supertest')(app.getHttpServer())
        .put(`/students/${studentId1}/preferences`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ availableDayPattern: 'Odd', unavailableTimeRanges: [] });
      expect(res.status).toBe(200);

      const getRes = await require('supertest')(app.getHttpServer())
        .get(`/students/${studentId1}/preferences`)
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(getRes.body.availableDayPattern).toBe('Odd');
    });

    it('Teacher access is limited to permitted operations (no student list)', async () => {
      const resList = await require('supertest')(app.getHttpServer())
        .get('/students')
        .set('Authorization', `Bearer ${teacherToken1}`);
      expect(resList.status).toBe(403);
      
      const resGet = await require('supertest')(app.getHttpServer())
        .get(`/students/${studentId1}`)
        .set('Authorization', `Bearer ${teacherToken1}`);
      expect(resGet.status).toBe(200); // Read a single student is permitted per RBAC spec above
    });
  });
});
