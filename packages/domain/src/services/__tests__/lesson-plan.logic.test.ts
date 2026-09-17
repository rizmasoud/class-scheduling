import { describe, it, expect } from "vitest";
import { canViewLessonPlan, canEditLessonPlan, computeSyllabusProgress } from "../lesson-plan.logic";

describe("Phase 4.7 Domain Logic: Lesson Plans & Syllabus Execution", () => {
  describe("canViewLessonPlan", () => {
    it("allows Supervisor to view any lesson plan", () => {
      const res = canViewLessonPlan({
        userRole: "Supervisor",
        classTeacherId: "teacher-1",
      });
      expect(res.allowed).toBe(true);
    });

    it("allows Class Teacher to view their own lesson plan", () => {
      const res = canViewLessonPlan({
        userRole: "Teacher",
        userTeacherId: "teacher-1",
        classTeacherId: "teacher-1",
      });
      expect(res.allowed).toBe(true);
    });

    it("blocks unrelated Teacher from viewing lesson plan", () => {
      const res = canViewLessonPlan({
        userRole: "Teacher",
        userTeacherId: "teacher-2",
        classTeacherId: "teacher-1",
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Not authorized");
    });

    it("allows Substitute Teacher to view plan for session where they are actualTeacher", () => {
      const res = canViewLessonPlan({
        userRole: "Teacher",
        userTeacherId: "teacher-sub",
        classTeacherId: "teacher-1",
        session: {
          id: "sess-1",
          scheduledTeacherId: "teacher-1",
          actualTeacherId: "teacher-sub",
        },
      });
      expect(res.allowed).toBe(true);
    });

    it("allows Substitute Teacher to view plan for session with approved substitution request", () => {
      const res = canViewLessonPlan({
        userRole: "Teacher",
        userTeacherId: "teacher-sub",
        classTeacherId: "teacher-1",
        session: {
          id: "sess-1",
          scheduledTeacherId: "teacher-1",
          actualTeacherId: null,
        },
        approvedSubstituteTeacherIds: ["teacher-sub"],
      });
      expect(res.allowed).toBe(true);
    });

    it("blocks unassigned teacher even when checking session", () => {
      const res = canViewLessonPlan({
        userRole: "Teacher",
        userTeacherId: "teacher-random",
        classTeacherId: "teacher-1",
        session: {
          id: "sess-1",
          scheduledTeacherId: "teacher-1",
          actualTeacherId: "teacher-sub",
        },
        approvedSubstituteTeacherIds: ["teacher-sub"],
      });
      expect(res.allowed).toBe(false);
    });
  });

  describe("canEditLessonPlan", () => {
    it("allows Supervisor to edit lesson plan", () => {
      const res = canEditLessonPlan({
        userRole: "Supervisor",
        classTeacherId: "teacher-1",
      });
      expect(res.allowed).toBe(true);
    });

    it("allows Class Teacher to edit lesson plan", () => {
      const res = canEditLessonPlan({
        userRole: "Teacher",
        userTeacherId: "teacher-1",
        classTeacherId: "teacher-1",
      });
      expect(res.allowed).toBe(true);
    });

    it("blocks unrelated Teacher from editing lesson plan", () => {
      const res = canEditLessonPlan({
        userRole: "Teacher",
        userTeacherId: "teacher-2",
        classTeacherId: "teacher-1",
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("only edit lesson plans for classes they teach");
    });

    it("blocks Substitute Teacher from editing master class lesson plan", () => {
      const res = canEditLessonPlan({
        userRole: "Teacher",
        userTeacherId: "teacher-sub",
        classTeacherId: "teacher-1",
      });
      expect(res.allowed).toBe(false);
    });
  });

  describe("computeSyllabusProgress & Syllabus Item Reuse", () => {
    const syllabusItems = [
      { id: "s1", sessionNumber: 1, topic: "Introduction & Greetings" },
      { id: "s2", sessionNumber: 2, topic: "Simple Past Tense" },
      { id: "s3", sessionNumber: 3, topic: "Reading Comprehension" },
    ];

    it("computes coverage and allows syllabus items to be repeated across sessions", () => {
      const planEntries = [
        { sessionId: "sess-1", syllabusItemId: "s1" },
        { sessionId: "sess-2", syllabusItemId: "s1" },
        { sessionId: "sess-3", syllabusItemId: "s2" },
      ];

      const progress = computeSyllabusProgress(syllabusItems, planEntries);

      expect(progress.totalItems).toBe(3);
      expect(progress.coveredItemsCount).toBe(2);
      expect(progress.coveragePercentage).toBe(67);

      const s1Cov = progress.itemCoverage.find((i) => i.syllabusItemId === "s1");
      expect(s1Cov?.coveredCount).toBe(2);
      expect(s1Cov?.isCovered).toBe(true);

      const s3Cov = progress.itemCoverage.find((i) => i.syllabusItemId === "s3");
      expect(s3Cov?.coveredCount).toBe(0);
      expect(s3Cov?.isCovered).toBe(false);
    });

    it("returns 100% when all syllabus items are covered", () => {
      const planEntries = [
        { sessionId: "sess-1", syllabusItemId: "s1" },
        { sessionId: "sess-2", syllabusItemId: "s2" },
        { sessionId: "sess-3", syllabusItemId: "s3" },
      ];

      const progress = computeSyllabusProgress(syllabusItems, planEntries);
      expect(progress.coveragePercentage).toBe(100);
      expect(progress.coveredItemsCount).toBe(3);
    });
  });
});
