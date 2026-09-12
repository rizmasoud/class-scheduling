import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePgLite } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../src/infrastructure/database/schema";
import { AppModule } from "../src/app.module";
import * as argon2 from "argon2";
import * as path from "path";
import request from "supertest";

// We will use standard supertest with PGlite for the standard functional tests,
// and a separate pg.Client based test for the live two-connection concurrency test.

describe("Attendance and Substitution (e2e)", () => {
  let app: any;
  let server: any;
  let db: any;
  let supToken: string;
  let t1Token: string;
  let t2Token: string;
  let supId: string;
  let teacher1Id: string;
  let teacher2Id: string;
  let sessionId: string;
  let pgliteClient: PGlite;

  beforeAll(async () => {
    pgliteClient = new PGlite();
    db = drizzlePgLite(pgliteClient, { schema });
    await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../../drizzle') });

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider("PG_CONNECTION")
      .useValue(db)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    server = app.getHttpServer();

    // 1. Seed users
    const hash = await argon2.hash("password123");
    const [supUser] = await db.insert(schema.users).values({ username: "sup_att", passwordHash: hash, role: "Supervisor" }).returning();
    supId = supUser.id;
    
    const [t1User] = await db.insert(schema.users).values({ username: "t1_att", passwordHash: hash, role: "Teacher" }).returning();
    const [t1] = await db.insert(schema.teachers).values({ userId: t1User.id, fullName: "T1" }).returning();
    teacher1Id = t1.id;

    const [t2User] = await db.insert(schema.users).values({ username: "t2_att", passwordHash: hash, role: "Teacher" }).returning();
    const [t2] = await db.insert(schema.teachers).values({ userId: t2User.id, fullName: "T2" }).returning();
    teacher2Id = t2.id;

    const supLogin = await request(server).post("/auth/login").send({ username: "sup_att", password: "password123" });
    supToken = supLogin.body.access_token;

    const t1Login = await request(server).post("/auth/login").send({ username: "t1_att", password: "password123" });
    t1Token = t1Login.body.access_token; 

    const t2Login = await request(server).post("/auth/login").send({ username: "t2_att", password: "password123" });
    t2Token = t2Login.body.access_token;
  });

  afterAll(async () => {
    await app.close();
    await pgliteClient.close();
  });

  it("should seed class and session", async () => {
    const [term] = await db.insert(schema.academicTerms).values({ name: "Term A", startDate: "2027-01-01", endDate: "2027-03-31", status: "Active" }).returning();
    const [book] = await db.insert(schema.books).values({ title: "Book A", sequenceOrder: 1, sessionCount: 2 }).returning();
    const [cls] = await db.insert(schema.classes).values({ termId: term.id, bookId: book.id, teacherId: teacher1Id, name: "Class A", classType: "Regular" }).returning();
    const [session] = await db.insert(schema.classSessions).values({ classId: cls.id, date: "2027-01-05", startTime: "10:00", endTime: "11:30", scheduledTeacherId: teacher1Id, actualTeacherId: teacher1Id }).returning();
    
    // Add skill for T2
    await db.insert(schema.teacherSkills).values({ teacherId: teacher2Id, bookId: book.id });

    sessionId = session.id;
  });

  it("should create broadcast substitution request", async () => {
    const res = await request(server)
      .post(`/substitution-requests/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${t1Token}`)
      .send({ isBroadcast: true });
    
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Broadcast");
  });

  it("should prevent duplicate substitution requests", async () => {
    const res = await request(server)
      .post(`/substitution-requests/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${t1Token}`)
      .send({ isBroadcast: true });
    
    expect(res.status).toBe(409); // Conflict
  });

  let requestId: string;
  it("should allow eligible teacher to claim broadcast", async () => {
    const req = await db.query.substitutionRequests.findFirst();
    requestId = req.id;

    const res = await request(server)
      .post(`/substitution-requests/${requestId}/claim`)
      .set("Authorization", `Bearer ${t2Token}`);
    
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Accepted");
    expect(res.body.acceptedById).toBe(teacher2Id);
  });

  it("should prevent original teacher from claiming their own broadcast", async () => {
    const res = await request(server)
      .post(`/substitution-requests/${requestId}/claim`)
      .set("Authorization", `Bearer ${t1Token}`);
    
    expect(res.status).toBe(409); // No longer broadcast, or own session
  });

  it("should approve the substitution", async () => {
    const res = await request(server)
      .patch(`/substitution-requests/${requestId}/approve`)
      .set("Authorization", `Bearer ${supToken}`)
      .send({ approved: true });
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Approved");

    // verify actualTeacherId is updated
    const session = await db.query.classSessions.findFirst({ where: (s, { eq }) => eq(s.id, sessionId) });
    expect(session.actualTeacherId).toBe(teacher2Id);
  });

  it("should allow substitute to submit attendance", async () => {
    const res = await request(server)
      .post(`/attendance/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${t2Token}`)
      .send({ status: "Present" });
    
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Present");

    const session = await db.query.classSessions.findFirst({ where: (s, { eq }) => eq(s.id, sessionId) });
    expect(session.status).toBe("Completed");
  });

  it("should prevent duplicate attendance", async () => {
    const res = await request(server)
      .post(`/attendance/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${t2Token}`)
      .send({ status: "Present" });
    
    expect(res.status).toBe(409); // Conflict
  });

  it("should prevent original teacher from submitting attendance since sub did it", async () => {
    const res = await request(server)
      .post(`/attendance/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${t1Token}`)
      .send({ status: "Present" });
    
    expect(res.status).toBe(409); // Already submitted
  });

  it("should allow supervisor to view all attendance and teacher to view only own", async () => {
    // Supervisor list
    const supRes = await request(server)
      .get("/attendance")
      .set("Authorization", `Bearer ${supToken}`);
    expect(supRes.status).toBe(200);
    expect(supRes.body.length).toBeGreaterThanOrEqual(1);

    // Teacher list - only t2's attendance
    const t2Res = await request(server)
      .get("/attendance")
      .set("Authorization", `Bearer ${t2Token}`);
    expect(t2Res.status).toBe(200);
    expect(t2Res.body.every((a: any) => a.teacherId === teacher2Id)).toBe(true);

    // Teacher 1 has no attendances yet
    const t1Res = await request(server)
      .get("/attendance")
      .set("Authorization", `Bearer ${t1Token}`);
    expect(t1Res.status).toBe(200);
    expect(t1Res.body.length).toBe(0);
  });

  it("should ensure attendance cannot be modified or deleted (immutable)", async () => {
    const putRes = await request(server)
      .put(`/attendance/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${t2Token}`)
      .send({ status: "Absent" });
    expect(putRes.status).toBe(404); // Endpoint does not exist

    const deleteRes = await request(server)
      .delete(`/attendance/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${supToken}`);
    expect(deleteRes.status).toBe(404); // Endpoint does not exist
  });

  it("should prevent marking attendance on a cancelled session", async () => {
    const [cls] = await db.select().from(schema.classes).limit(1);
    const [cancelledSession] = await db.insert(schema.classSessions).values({
      classId: cls.id,
      date: "2027-01-06",
      startTime: "12:00",
      endTime: "13:30",
      scheduledTeacherId: teacher1Id,
      actualTeacherId: teacher1Id,
      status: "Cancelled",
    }).returning();

    const res = await request(server)
      .post(`/attendance/sessions/${cancelledSession.id}`)
      .set("Authorization", `Bearer ${t1Token}`)
      .send({ status: "Present" });
    expect(res.status).toBe(409); // Cannot mark cancelled session taught
  });

  it("should list eligible teachers for a session and exclude scheduled teacher", async () => {
    const [cls] = await db.select().from(schema.classes).limit(1);
    const [newSession] = await db.insert(schema.classSessions).values({
      classId: cls.id,
      date: "2027-01-10",
      startTime: "09:00",
      endTime: "10:30",
      scheduledTeacherId: teacher1Id,
      actualTeacherId: teacher1Id,
      status: "Scheduled",
    }).returning();

    const res = await request(server)
      .get(`/substitution-requests/sessions/${newSession.id}/eligible-teachers`)
      .set("Authorization", `Bearer ${t1Token}`);
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: teacher2Id, fullName: "T2" }]);
  });

  it("should reject direct substitution request for ineligible teacher", async () => {
    // Create a 3rd teacher with no skills
    const hash = await argon2.hash("password123");
    const [t3User] = await db.insert(schema.users).values({ username: "t3_noskill", passwordHash: hash, role: "Teacher" }).returning();
    const [t3] = await db.insert(schema.teachers).values({ userId: t3User.id, fullName: "T3" }).returning();

    const [cls] = await db.select().from(schema.classes).limit(1);
    const [sess] = await db.insert(schema.classSessions).values({
      classId: cls.id,
      date: "2027-01-11",
      startTime: "09:00",
      endTime: "10:30",
      scheduledTeacherId: teacher1Id,
      actualTeacherId: teacher1Id,
      status: "Scheduled",
    }).returning();

    const res = await request(server)
      .post(`/substitution-requests/sessions/${sess.id}`)
      .set("Authorization", `Bearer ${t1Token}`)
      .send({ isBroadcast: false, requestedSubstituteId: t3.id });
    
    expect(res.status).toBe(409); // Ineligible
  });

  it("should support supervisor rejection of a substitution request", async () => {
    const [cls] = await db.select().from(schema.classes).limit(1);
    const [sess] = await db.insert(schema.classSessions).values({
      classId: cls.id,
      date: "2027-01-12",
      startTime: "09:00",
      endTime: "10:30",
      scheduledTeacherId: teacher1Id,
      actualTeacherId: teacher1Id,
      status: "Scheduled",
    }).returning();

    const createRes = await request(server)
      .post(`/substitution-requests/sessions/${sess.id}`)
      .set("Authorization", `Bearer ${t1Token}`)
      .send({ isBroadcast: false, requestedSubstituteId: teacher2Id });
    expect(createRes.status).toBe(201);

    const rejRes = await request(server)
      .patch(`/substitution-requests/${createRes.body.id}/approve`)
      .set("Authorization", `Bearer ${supToken}`)
      .send({ approved: false });
    
    expect(rejRes.status).toBe(200);
    expect(rejRes.body.status).toBe("Rejected");

    // scheduledTeacherId and actualTeacherId remain untouched
    const session = await db.query.classSessions.findFirst({ where: (s: any, { eq }: any) => eq(s.id, sess.id) });
    expect(session.scheduledTeacherId).toBe(teacher1Id);
    expect(session.actualTeacherId).toBe(teacher1Id);
  });

  it("should support supervisor emergency assignment retroactively and preserve scheduledTeacherId", async () => {
    const [cls] = await db.select().from(schema.classes).limit(1);
    // Past date (retroactive)
    const [pastSession] = await db.insert(schema.classSessions).values({
      classId: cls.id,
      date: "2026-12-01",
      startTime: "08:00",
      endTime: "09:30",
      scheduledTeacherId: teacher1Id,
      actualTeacherId: teacher1Id,
      status: "Scheduled",
    }).returning();

    const res = await request(server)
      .post(`/substitution-requests/sessions/${pastSession.id}/emergency`)
      .set("Authorization", `Bearer ${supToken}`)
      .send({ substituteTeacherId: teacher2Id, reason: "Emergency sudden flu" });
    
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Approved");
    expect(res.body.requestedSubstituteId).toBe(teacher2Id);

    // Verify scheduledTeacherId is preserved and actualTeacherId is teacher2Id
    const session = await db.query.classSessions.findFirst({ where: (s: any, { eq }: any) => eq(s.id, pastSession.id) });
    expect(session.scheduledTeacherId).toBe(teacher1Id);
    expect(session.actualTeacherId).toBe(teacher2Id);
  });

  it("should enforce RBAC: teacher cannot approve substitutions or make emergency assignments", async () => {
    const [cls] = await db.select().from(schema.classes).limit(1);
    const [sess] = await db.insert(schema.classSessions).values({
      classId: cls.id,
      date: "2027-01-15",
      startTime: "08:00",
      endTime: "09:30",
      scheduledTeacherId: teacher1Id,
      actualTeacherId: teacher1Id,
      status: "Scheduled",
    }).returning();

    // Teacher cannot call emergency assignment
    const emRes = await request(server)
      .post(`/substitution-requests/sessions/${sess.id}/emergency`)
      .set("Authorization", `Bearer ${t1Token}`)
      .send({ substituteTeacherId: teacher2Id });
    expect(emRes.status).toBe(403); // Forbidden

    // Create a request
    const createRes = await request(server)
      .post(`/substitution-requests/sessions/${sess.id}`)
      .set("Authorization", `Bearer ${t1Token}`)
      .send({ isBroadcast: false, requestedSubstituteId: teacher2Id });
    expect(createRes.status).toBe(201);

    // Teacher cannot approve
    const appRes = await request(server)
      .patch(`/substitution-requests/${createRes.body.id}/approve`)
      .set("Authorization", `Bearer ${t2Token}`)
      .send({ approved: true });
    expect(appRes.status).toBe(403); // Forbidden
  });
});
