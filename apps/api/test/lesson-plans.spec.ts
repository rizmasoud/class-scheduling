import { describe, it, expect, beforeAll, afterAll } from "vitest";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-do-not-use-in-production-32-chars-long";

import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePgLite } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../src/infrastructure/database/schema";
import { AppModule } from "../src/app.module";
import { JwtService } from "@nestjs/jwt";
import { eq } from "drizzle-orm";
import * as path from "path";
import request from "supertest";

describe("Phase 4.7 Lesson Plans & Syllabus Execution API", () => {
  let app: INestApplication;
  let pgliteClient: PGlite;
  let db: any;
  let jwtService: JwtService;

  let supervisorToken: string;
  let supervisorUser: any;
  let teacher1Token: string;
  let teacher1User: any;
  let teacher1Record: any;
  let teacher2Token: string;
  let teacher2User: any;
  let teacher2Record: any;
  let substituteToken: string;
  let substituteUser: any;
  let substituteRecord: any;

  let testTerm: any;
  let testBook: any;
  let syllabusItem1: any;
  let syllabusItem2: any;
  let syllabusItem3: any;
  let testClass: any;
  let session1: any;
  let session2: any;
  let session3: any;

  beforeAll(async () => {
    pgliteClient = new PGlite();
    db = drizzlePgLite(pgliteClient, { schema });
    await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../../drizzle") });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider("PG_CONNECTION")
      .useValue(db)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    const { AllExceptionsFilter } = await import('../src/common/all-exceptions.filter');
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    jwtService = moduleRef.get(JwtService);

    // Create Supervisor
    const [supUser] = await db
      .insert(schema.users)
      .values({
        username: `supervisor_${Date.now()}`,
        passwordHash: "dummy",
        role: "Supervisor", isActive: true,
      })
      .returning();
    supervisorUser = supUser;
    supervisorToken = jwtService.sign({
      sub: supUser.id,
      username: supUser.username,
      role: supUser.role,
    });

    // Create Teacher 1 (Class Teacher)
    const [t1User] = await db
      .insert(schema.users)
      .values({
        username: `teacher1_${Date.now()}`,
        passwordHash: "dummy",
        role: "Teacher", isActive: true,
      })
      .returning();
    teacher1User = t1User;
    const [t1] = await db
      .insert(schema.teachers)
      .values({
        userId: t1User.id,
        fullName: "Teacher One",
      })
      .returning();
    teacher1Record = t1;
    teacher1Token = jwtService.sign({
      sub: t1User.id,
      username: t1User.username,
      role: t1User.role,
      teacherId: t1.id,
    });

    // Create Teacher 2 (Unrelated Teacher)
    const [t2User] = await db
      .insert(schema.users)
      .values({
        username: `teacher2_${Date.now()}`,
        passwordHash: "dummy",
        role: "Teacher", isActive: true,
      })
      .returning();
    teacher2User = t2User;
    const [t2] = await db
      .insert(schema.teachers)
      .values({
        userId: t2User.id,
        fullName: "Teacher Two",
      })
      .returning();
    teacher2Record = t2;
    teacher2Token = jwtService.sign({
      sub: t2User.id,
      username: t2User.username,
      role: t2User.role,
      teacherId: t2.id,
    });

    // Create Substitute Teacher
    const [subU] = await db
      .insert(schema.users)
      .values({
        username: `substitute_${Date.now()}`,
        passwordHash: "dummy",
        role: "Teacher", isActive: true,
      })
      .returning();
    substituteUser = subU;
    const [subRec] = await db
      .insert(schema.teachers)
      .values({
        userId: subU.id,
        fullName: "Substitute Teacher",
      })
      .returning();
    substituteRecord = subRec;
    substituteToken = jwtService.sign({
      sub: subU.id,
      username: subU.username,
      role: subU.role,
      teacherId: subRec.id,
    });

    // Create Academic Term
    const [term] = await db
      .insert(schema.academicTerms)
      .values({
        name: `Term ${Date.now()}`,
        startDate: "2026-09-01",
        endDate: "2026-12-31",
        status: "Active",
      })
      .returning();
    testTerm = term;

    // Create Book
    const [book] = await db
      .insert(schema.books)
      .values({
        title: "English Level 1",
        level: "Beginner",
        sequenceOrder: 1,
        sessionCount: 20,
      })
      .returning();
    testBook = book;

    // Create 3 Canonical Syllabus Items
    const [s1] = await db
      .insert(schema.bookSyllabusItems)
      .values({
        bookId: book.id,
        sessionNumber: 1,
        topic: "Alphabet & Phonetics",
        description: "Standard intro",
      })
      .returning();
    syllabusItem1 = s1;

    const [s2] = await db
      .insert(schema.bookSyllabusItems)
      .values({
        bookId: book.id,
        sessionNumber: 2,
        topic: "Basic Greetings & Pronouns",
        description: "Workbook exercises 1-4",
      })
      .returning();
    syllabusItem2 = s2;

    const [s3] = await db
      .insert(schema.bookSyllabusItems)
      .values({
        bookId: book.id,
        sessionNumber: 3,
        topic: "Numbers & Dates",
        description: "Dialogue role-play",
      })
      .returning();
    syllabusItem3 = s3;

    // Create Class with Teacher 1
    const [cls] = await db
      .insert(schema.classes)
      .values({
        name: "Morning Beginners A1",
        termId: testTerm.id,
        bookId: testBook.id,
        teacherId: teacher1Record.id,
        classType: "Regular",
        status: "Scheduled",
      })
      .returning();
    testClass = cls;

    // Create 3 Class Sessions
    const [sess1] = await db
      .insert(schema.classSessions)
      .values({
        classId: testClass.id,
        date: "2026-09-05",
        startTime: "09:00:00",
        endTime: "10:30:00",
        scheduledTeacherId: teacher1Record.id,
        actualTeacherId: null,
        status: "Scheduled",
      })
      .returning();
    session1 = sess1;

    const [sess2] = await db
      .insert(schema.classSessions)
      .values({
        classId: testClass.id,
        date: "2026-09-07",
        startTime: "09:00:00",
        endTime: "10:30:00",
        scheduledTeacherId: teacher1Record.id,
        actualTeacherId: substituteRecord.id, // Substitute assigned as actual teacher!
        status: "Scheduled",
      })
      .returning();
    session2 = sess2;

    const [sess3] = await db
      .insert(schema.classSessions)
      .values({
        classId: testClass.id,
        date: "2026-09-09",
        startTime: "09:00:00",
        endTime: "10:30:00",
        scheduledTeacherId: teacher1Record.id,
        actualTeacherId: null,
        status: "Scheduled",
      })
      .returning();
    session3 = sess3;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("1. Returns default empty slots derived directly from the actual class sessions", async () => {
    const res = await request(app.getHttpServer())
      .get(`/classes/${testClass.id}/lesson-plan`)
      .set("Authorization", `Bearer ${teacher1Token}`);
    if (res.status !== 200) {
      console.error("DEBUG TEST 1 ERROR BODY:", res.status, res.body);
    }
    expect(res.status).toBe(200);

    expect(res.body.classId).toBe(testClass.id);
    expect(res.body.entries).toBeDefined();
    // Must be exactly 3 entries matching the 3 class sessions
    expect(res.body.entries.length).toBe(3);
    expect(res.body.entries[0].sessionId).toBe(session1.id);
    expect(res.body.entries[0].sessionIndex).toBe(1);
    expect(res.body.entries[1].sessionId).toBe(session2.id);
    expect(res.body.entries[2].sessionId).toBe(session3.id);
  });

  it("2. Allows the assigned Teacher to save lesson plan entries with canonical syllabus associations and homework", async () => {
    const payload = {
      title: "Morning Beginners Term Plan",
      notes: "Focus on oral conversation",
      entries: [
        {
          sessionId: session1.id,
          syllabusItemId: syllabusItem1.id,
          plannedTopics: "Alphabet recitation & pronunciation drill",
          homeworkAssigned: "Complete pages 4-5 in workbook",
        },
        {
          sessionId: session2.id,
          syllabusItemId: syllabusItem1.id, // CANONICAL REUSE: same syllabus item on next session
          plannedTopics: "Phonetics review & listening",
          homeworkAssigned: "Listen to audio track 1",
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .post(`/classes/${testClass.id}/lesson-plan`)
      .set("Authorization", `Bearer ${teacher1Token}`)
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.planId).toBeDefined();

    // Verify persisted plan
    const getRes = await request(app.getHttpServer())
      .get(`/classes/${testClass.id}/lesson-plan`)
      .set("Authorization", `Bearer ${teacher1Token}`)
      .expect(200);

    expect(getRes.body.title).toBe("Morning Beginners Term Plan");
    expect(getRes.body.notes).toBe("Focus on oral conversation");
    expect(getRes.body.entries[0].plannedTopics).toBe("Alphabet recitation & pronunciation drill");
    expect(getRes.body.entries[0].syllabusItemId).toBe(syllabusItem1.id);
    expect(getRes.body.entries[0].syllabusTopic).toBe(syllabusItem1.topic);
    expect(getRes.body.entries[1].syllabusItemId).toBe(syllabusItem1.id); // Confirms reuse
  });

  it("3. Verifies Audit Logs were created for lesson plan creation and entry updates", async () => {
    const logs = await db.query.auditLogs.findMany({
      where: eq(schema.auditLogs.changedBy, teacher1User.id),
    });

    const planAudit = logs.find((l: any) => l.tableName === "lesson_plans");
    expect(planAudit).toBeDefined();
    expect(planAudit?.action).toBe("CREATE_LESSON_PLAN");

    const entryAudit = logs.find((l: any) => l.tableName === "session_lesson_plan_entries");
    expect(entryAudit).toBeDefined();
  });

  it("4. Allows Supervisor to view the lesson plan and inspect syllabus execution progress", async () => {
    const planRes = await request(app.getHttpServer())
      .get(`/classes/${testClass.id}/lesson-plan`)
      .set("Authorization", `Bearer ${supervisorToken}`)
      .expect(200);

    expect(planRes.body.classId).toBe(testClass.id);

    const progressRes = await request(app.getHttpServer())
      .get(`/classes/${testClass.id}/lesson-plan/progress`)
      .set("Authorization", `Bearer ${supervisorToken}`)
      .expect(200);

    expect(progressRes.body.totalSyllabusItems).toBe(3);
    // syllabusItem1 is covered (used twice), syllabusItem2 & 3 not yet covered
    expect(progressRes.body.coveredItemsCount).toBe(1);
    expect(progressRes.body.coveragePercentage).toBe(33);

    const item1 = progressRes.body.items.find((i: any) => i.syllabusItemId === syllabusItem1.id);
    expect(item1.coveredCount).toBe(2);
    expect(item1.isCovered).toBe(true);
  });

  it("5. Allows Assigned Substitute Teacher read-only access to the lesson plan", async () => {
    const res = await request(app.getHttpServer())
      .get(`/classes/${testClass.id}/lesson-plan`)
      .set("Authorization", `Bearer ${substituteToken}`)
      .expect(200);

    expect(res.body.classId).toBe(testClass.id);
    expect(res.body.entries.length).toBe(3);
  });

  it("6. Prevents Unrelated Teacher from viewing the lesson plan", async () => {
    await request(app.getHttpServer())
      .get(`/classes/${testClass.id}/lesson-plan`)
      .set("Authorization", `Bearer ${teacher2Token}`)
      .expect(403);
  });

  it("7. Prevents Unrelated Teacher from saving or editing the lesson plan", async () => {
    await request(app.getHttpServer())
      .post(`/classes/${testClass.id}/lesson-plan`)
      .set("Authorization", `Bearer ${teacher2Token}`)
      .send({
        entries: [
          {
            sessionId: session1.id,
            plannedTopics: "Malicious modification",
          },
        ],
      })
      .expect(403);
  });

  it("8. Allows continuous in-term edits with NO permanent status lock", async () => {
    const updatePayload = {
      entries: [
        {
          sessionId: session1.id,
          actualTaughtNotes: "Class went great, completed all alphabet flashcards.",
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .post(`/classes/${testClass.id}/lesson-plan`)
      .set("Authorization", `Bearer ${teacher1Token}`)
      .send(updatePayload)
      .expect(201);

    expect(res.body.success).toBe(true);

    const getRes = await request(app.getHttpServer())
      .get(`/classes/${testClass.id}/lesson-plan`)
      .set("Authorization", `Bearer ${teacher1Token}`)
      .expect(200);

    expect(getRes.body.entries[0].actualTaughtNotes).toBe(
      "Class went great, completed all alphabet flashcards.",
    );
  });

  it("9. Exports Lesson Plan in CSV format for spreadsheet compatibility", async () => {
    const res = await request(app.getHttpServer())
      .get(`/classes/${testClass.id}/lesson-plan/export?format=csv`)
      .set("Authorization", `Bearer ${teacher1Token}`)
      .expect(200);

    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain("Session #,Date,Start Time,End Time");
    expect(res.text).toContain("Alphabet recitation & pronunciation drill");
  });
});
