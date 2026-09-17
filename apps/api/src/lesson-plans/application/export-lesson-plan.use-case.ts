import { Injectable } from "@nestjs/common";
import { GetLessonPlanUseCase } from "./get-lesson-plan.use-case";

@Injectable()
export class ExportLessonPlanUseCase {
  constructor(private readonly getLessonPlanUseCase: GetLessonPlanUseCase) {}

  async execute(classId: string, format: "csv" | "json", userRole: string, teacherId?: string) {
    const plan = await this.getLessonPlanUseCase.execute(classId, userRole, teacherId);

    if (format === "json") {
      return {
        contentType: "application/json",
        data: JSON.stringify(plan, null, 2),
        filename: `lesson-plan-${classId}.json`,
      };
    }

    const headers = [
      "Session #",
      "Date",
      "Start Time",
      "End Time",
      "Session Status",
      "Syllabus Topic",
      "Planned Topics",
      "Homework Assigned",
      "Actual Taught Notes",
    ];

    const rows = plan.entries.map((e: any) => [
      e.sessionIndex,
      e.sessionDate,
      e.sessionStartTime,
      e.sessionEndTime,
      e.sessionStatus,
      `"${(e.syllabusTopic || "").replace(/"/g, '""')}"`,
      `"${(e.plannedTopics || "").replace(/"/g, '""')}"`,
      `"${(e.homeworkAssigned || "").replace(/"/g, '""')}"`,
      `"${(e.actualTaughtNotes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");

    return {
      contentType: "text/csv",
      data: csvContent,
      filename: `lesson-plan-${classId}.csv`,
    };
  }
}
