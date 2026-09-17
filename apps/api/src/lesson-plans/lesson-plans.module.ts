import { Module } from "@nestjs/common";
import { DatabaseModule } from "../infrastructure/database/database.module";
import { LessonPlansController } from "./presentation/lesson-plans.controller";
import { GetLessonPlanUseCase } from "./application/get-lesson-plan.use-case";
import { SaveLessonPlanUseCase } from "./application/save-lesson-plan.use-case";
import { GetSyllabusProgressUseCase } from "./application/get-syllabus-progress.use-case";
import { ExportLessonPlanUseCase } from "./application/export-lesson-plan.use-case";

@Module({
  imports: [DatabaseModule],
  controllers: [LessonPlansController],
  providers: [
    GetLessonPlanUseCase,
    SaveLessonPlanUseCase,
    GetSyllabusProgressUseCase,
    ExportLessonPlanUseCase,
  ],
  exports: [
    GetLessonPlanUseCase,
    SaveLessonPlanUseCase,
    GetSyllabusProgressUseCase,
    ExportLessonPlanUseCase,
  ],
})
export class LessonPlansModule {}
