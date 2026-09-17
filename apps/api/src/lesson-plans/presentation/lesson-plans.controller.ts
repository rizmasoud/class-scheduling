import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Res } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { GetLessonPlanUseCase } from "../application/get-lesson-plan.use-case";
import { SaveLessonPlanUseCase } from "../application/save-lesson-plan.use-case";
import { GetSyllabusProgressUseCase } from "../application/get-syllabus-progress.use-case";
import { ExportLessonPlanUseCase } from "../application/export-lesson-plan.use-case";
import { SaveLessonPlanDto } from "./lesson-plan.dto";
import type { Response } from "express";

@Controller("classes/:classId/lesson-plan")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class LessonPlansController {
  constructor(
    private readonly getLessonPlanUseCase: GetLessonPlanUseCase,
    private readonly saveLessonPlanUseCase: SaveLessonPlanUseCase,
    private readonly getSyllabusProgressUseCase: GetSyllabusProgressUseCase,
    private readonly exportLessonPlanUseCase: ExportLessonPlanUseCase,
  ) {}

  @Get()
  @Roles("Supervisor", "Teacher")
  async getLessonPlan(
    @Param("classId") classId: string,
    @Request() req: any,
  ) {
    try {
      return await this.getLessonPlanUseCase.execute(
        classId,
        req.user.role,
        req.user.teacherId,
      );
    } catch (err) {
      console.error("CONTROLLER ERROR IN getLessonPlan:", err);
      throw err;
    }
  }

  @Post()
  @Roles("Supervisor", "Teacher")
  async saveLessonPlan(
    @Param("classId") classId: string,
    @Body() dto: SaveLessonPlanDto,
    @Request() req: any,
  ) {
    return await this.saveLessonPlanUseCase.execute({
      classId,
      user: {
        userId: req.user.userId,
        username: req.user.username,
        role: req.user.role,
        teacherId: req.user.teacherId,
      },
      title: dto.title,
      notes: dto.notes,
      entries: dto.entries,
    });
  }

  @Get("progress")
  @Roles("Supervisor", "Teacher")
  async getSyllabusProgress(
    @Param("classId") classId: string,
  ) {
    return await this.getSyllabusProgressUseCase.execute(classId);
  }

  @Get("export")
  @Roles("Supervisor", "Teacher")
  async exportPlan(
    @Param("classId") classId: string,
    @Query("format") format: "csv" | "json" = "csv",
    @Request() req: any,
    @Res() res: Response,
  ) {
    const exported = await this.exportLessonPlanUseCase.execute(
      classId,
      format,
      req.user.role,
      req.user.teacherId,
    );

    res.setHeader("Content-Type", exported.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${exported.filename}"`);
    return res.send(exported.data);
  }
}
