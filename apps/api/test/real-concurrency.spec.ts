import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from 'pg';

describe('Phase 4.6 Live Multi-Connection Concurrency & Invariants (PostgreSQL)', () => {
  let c1: Client;
  let c2: Client;
  let termId: string;
  let bookId: string;
  let u1: string;
  let t1: string;
  let u2: string;
  let t2: string;
  let clsId: string;

  beforeAll(async () => {
    c1 = new Client({ connectionString: process.env.DATABASE_URL });
    c2 = new Client({ connectionString: process.env.DATABASE_URL });
    await c1.connect();
    await c2.connect();

    // Seed test records
    const termRes = await c1.query(
      `INSERT INTO academic_terms (id, name, start_date, end_date, status) VALUES (gen_random_uuid(), 'Term Concurrency Spec', '2027-01-01', '2027-03-31', 'Active') RETURNING id`
    );
    termId = termRes.rows[0].id;

    const bookRes = await c1.query(
      `INSERT INTO books (id, title, sequence_order, session_count) VALUES (gen_random_uuid(), 'Book Concurrency Spec', 1, 2) RETURNING id`
    );
    bookId = bookRes.rows[0].id;

    const u1Res = await c1.query(
      `INSERT INTO users (id, username, password_hash, role) VALUES (gen_random_uuid(), 'u1_' || substr(md5(random()::text), 1, 8), 'hash', 'Teacher') RETURNING id`
    );
    u1 = u1Res.rows[0].id;
    const t1Res = await c1.query(
      `INSERT INTO teachers (id, user_id, full_name) VALUES (gen_random_uuid(), $1, 'Teacher 1 Spec') RETURNING id`,
      [u1]
    );
    t1 = t1Res.rows[0].id;

    const u2Res = await c1.query(
      `INSERT INTO users (id, username, password_hash, role) VALUES (gen_random_uuid(), 'u2_' || substr(md5(random()::text), 1, 8), 'hash', 'Teacher') RETURNING id`
    );
    u2 = u2Res.rows[0].id;
    const t2Res = await c1.query(
      `INSERT INTO teachers (id, user_id, full_name) VALUES (gen_random_uuid(), $1, 'Teacher 2 Spec') RETURNING id`,
      [u2]
    );
    t2 = t2Res.rows[0].id;

    const clsRes = await c1.query(
      `INSERT INTO classes (id, term_id, book_id, teacher_id, name, class_type) VALUES (gen_random_uuid(), $1, $2, $3, 'Class Concurrency Spec', 'Regular') RETURNING id`,
      [termId, bookId, t1]
    );
    clsId = clsRes.rows[0].id;
  });

  afterAll(async () => {
    await c1?.end();
    await c2?.end();
  });

  it('TWO-CONNECTION broadcast claim race: exactly one winner, no dual assignment', async () => {
    const sessRes = await c1.query(
      `INSERT INTO class_sessions (id, class_id, date, start_time, end_time, scheduled_teacher_id, actual_teacher_id, status) VALUES (gen_random_uuid(), $1, '2027-02-01', '10:00', '11:30', $2, $2, 'Scheduled') RETURNING id`,
      [clsId, t1]
    );
    const sessId = sessRes.rows[0].id;

    const subRes = await c1.query(
      `INSERT INTO substitution_requests (id, session_id, requested_by, status) VALUES (gen_random_uuid(), $1, $2, 'Broadcast') RETURNING id`,
      [sessId, u1]
    );
    const subId = subRes.rows[0].id;

    async function claim(client: Client, teacherId: string) {
      try {
        await client.query('BEGIN');
        const sel = await client.query(
          'SELECT id, status, accepted_by_id FROM substitution_requests WHERE id = $1 FOR UPDATE',
          [subId]
        );
        const row = sel.rows[0];
        if (row.status !== 'Broadcast' || row.accepted_by_id) {
          await client.query('ROLLBACK');
          return { success: false, reason: 'Already claimed or not broadcast' };
        }
        await new Promise((r) => setTimeout(r, 60));
        await client.query(
          "UPDATE substitution_requests SET status = 'Accepted', accepted_by_id = $1, updated_at = NOW() WHERE id = $2",
          [teacherId, subId]
        );
        await client.query('COMMIT');
        return { success: true, teacherId };
      } catch (err: any) {
        await client.query('ROLLBACK');
        return { success: false, error: err.message };
      }
    }

    const results = await Promise.all([claim(c1, t1), claim(c2, t2)]);
    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    const finalSub = await c1.query('SELECT status, accepted_by_id FROM substitution_requests WHERE id = $1', [subId]);
    expect(finalSub.rows[0].status).toBe('Accepted');
    expect([t1, t2]).toContain(finalSub.rows[0].accepted_by_id);
  });

  it('TWO-CONNECTION conflicting attendance submission race: unique index prevents duplicate attendance', async () => {
    const sessRes = await c1.query(
      `INSERT INTO class_sessions (id, class_id, date, start_time, end_time, scheduled_teacher_id, actual_teacher_id, status) VALUES (gen_random_uuid(), $1, '2027-02-02', '10:00', '11:30', $2, $2, 'Scheduled') RETURNING id`,
      [clsId, t1]
    );
    const sessId = sessRes.rows[0].id;

    async function submitAttendance(client: Client, teacherId: string) {
      try {
        await client.query('BEGIN');
        await client.query(
          "INSERT INTO teacher_attendances (id, session_id, teacher_id, status) VALUES (gen_random_uuid(), $1, $2, 'Present')",
          [sessId, teacherId]
        );
        await client.query("UPDATE class_sessions SET status = 'Completed', actual_teacher_id = $1 WHERE id = $2", [
          teacherId,
          sessId,
        ]);
        await client.query('COMMIT');
        return { success: true, teacherId };
      } catch (err: any) {
        await client.query('ROLLBACK');
        return { success: false, code: err.code, error: err.message };
      }
    }

    const attResults = await Promise.all([submitAttendance(c1, t1), submitAttendance(c2, t2)]);
    const successes = attResults.filter((r) => r.success);
    const failures = attResults.filter((r) => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect(failures[0].code).toBe('23505'); // unique constraint violation

    // Exactly one attendance row exists
    const attendances = await c1.query('SELECT * FROM teacher_attendances WHERE session_id = $1', [sessId]);
    expect(attendances.rows.length).toBe(1);
  });

  it('TWO-CONNECTION competing actual-teacher assignment race: row locking serializes updates', async () => {
    const sessRes = await c1.query(
      `INSERT INTO class_sessions (id, class_id, date, start_time, end_time, scheduled_teacher_id, actual_teacher_id, status) VALUES (gen_random_uuid(), $1, '2027-02-03', '10:00', '11:30', $2, $2, 'Scheduled') RETURNING id`,
      [clsId, t1]
    );
    const sessId = sessRes.rows[0].id;

    async function assignTeacher(client: Client, teacherId: string, delay: number) {
      try {
        await client.query('BEGIN');
        await client.query('SELECT id, actual_teacher_id FROM class_sessions WHERE id = $1 FOR UPDATE', [sessId]);
        await new Promise((r) => setTimeout(r, delay));
        await client.query('UPDATE class_sessions SET actual_teacher_id = $1 WHERE id = $2', [teacherId, sessId]);
        await client.query('COMMIT');
        return { success: true, teacherId };
      } catch (err: any) {
        await client.query('ROLLBACK');
        return { success: false, error: err.message };
      }
    }

    const results = await Promise.all([assignTeacher(c1, t1, 80), assignTeacher(c2, t2, 20)]);
    expect(results.every((r) => r.success)).toBe(true);

    const check = await c1.query('SELECT actual_teacher_id, scheduled_teacher_id FROM class_sessions WHERE id = $1', [
      sessId,
    ]);
    expect([t1, t2]).toContain(check.rows[0].actual_teacher_id);
    expect(check.rows[0].scheduled_teacher_id).toBe(t1); // scheduledTeacherId preserved
  });

  it('enforces active_substitution_idx partial unique index against concurrent creation', async () => {
    const sessRes = await c1.query(
      `INSERT INTO class_sessions (id, class_id, date, start_time, end_time, scheduled_teacher_id, actual_teacher_id, status) VALUES (gen_random_uuid(), $1, '2027-02-04', '10:00', '11:30', $2, $2, 'Scheduled') RETURNING id`,
      [clsId, t1]
    );
    const sessId = sessRes.rows[0].id;

    async function createActiveSub(client: Client, status: string) {
      try {
        await client.query('BEGIN');
        await client.query(
          'INSERT INTO substitution_requests (id, session_id, requested_by, status) VALUES (gen_random_uuid(), $1, $2, $3)',
          [sessId, u1, status]
        );
        await client.query('COMMIT');
        return { success: true, status };
      } catch (err: any) {
        await client.query('ROLLBACK');
        return { success: false, code: err.code, error: err.message };
      }
    }

    const results = await Promise.all([createActiveSub(c1, 'Pending'), createActiveSub(c2, 'Broadcast')]);
    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect(failures[0].code).toBe('23505'); // unique constraint violation
  });

  it('verifies complete transaction rollback on failure', async () => {
    const sessRes = await c1.query(
      `INSERT INTO class_sessions (id, class_id, date, start_time, end_time, scheduled_teacher_id, actual_teacher_id, status) VALUES (gen_random_uuid(), $1, '2027-02-05', '10:00', '11:30', $2, $2, 'Scheduled') RETURNING id`,
      [clsId, t1]
    );
    const sessId = sessRes.rows[0].id;

    try {
      await c1.query('BEGIN');
      await c1.query('UPDATE class_sessions SET actual_teacher_id = $1 WHERE id = $2', [t2, sessId]);
      throw new Error('Simulated failure before commit');
    } catch (err) {
      await c1.query('ROLLBACK');
    }

    const check = await c1.query('SELECT actual_teacher_id FROM class_sessions WHERE id = $1', [sessId]);
    expect(check.rows[0].actual_teacher_id).toBe(t1); // Unchanged!
  });
});
