import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SubmitAttendanceUseCase } from '../application/submit-attendance.use-case';
import { ListTeacherAttendanceUseCase } from '../application/list-teacher-attendance.use-case';
import { SubmitAttendanceDTO } from '@class-scheduling/contracts';

@Controller('attendance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AttendanceController {
  constructor(
    private submitAttendanceUseCase: SubmitAttendanceUseCase,
    private listTeacherAttendanceUseCase: ListTeacherAttendanceUseCase,
  ) {}

  @Get()
  @Roles('Teacher', 'Supervisor')
  async listAttendance(
    @Query('sessionId') sessionId: string | undefined,
    @Query('teacherId') teacherId: string | undefined,
    @Request() req: any,
  ) {
    return this.listTeacherAttendanceUseCase.execute(req.user.userId, req.user.role, {
      sessionId,
      teacherId,
    });
  }

  @Post('sessions/:sessionId')
  @Roles('Teacher', 'Supervisor')
  async submitAttendance(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitAttendanceDTO,
    @Request() req: any,
  ) {
    return this.submitAttendanceUseCase.execute(sessionId, req.user.userId, dto.status);
  }
}
