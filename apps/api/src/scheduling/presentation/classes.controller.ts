import { Controller, Get, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetClassUseCase } from '../application/get-class.use-case';
import { ListClassesUseCase } from '../application/list-classes.use-case';
import { GetClassSessionUseCase } from '../application/get-class-session.use-case';
import { ListClassSessionsUseCase } from '../application/list-class-sessions.use-case';
import { CancelClassSessionUseCase } from '../application/cancel-class-session.use-case';
import { UpdateClassSessionTeacherUseCase } from '../application/update-class-session-teacher.use-case';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateSessionTeacherDto {
  @IsString()
  @IsNotEmpty()
  actualTeacherId!: string;
}

@Controller('classes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ClassesController {
  constructor(
    private readonly getClassUseCase: GetClassUseCase,
    private readonly listClassesUseCase: ListClassesUseCase,
    private readonly getClassSessionUseCase: GetClassSessionUseCase,
    private readonly listClassSessionsUseCase: ListClassSessionsUseCase,
    private readonly cancelClassSessionUseCase: CancelClassSessionUseCase,
    private readonly updateClassSessionTeacherUseCase: UpdateClassSessionTeacherUseCase,
  ) {}

  @Get()
  @Roles('Supervisor', 'Teacher')
  async listClasses(@Request() req: any, @Query('termId') termId?: string) {
    const user = req.user;
    return this.listClassesUseCase.execute(user.role, user.teacherId, termId);
  }

  @Get(':id')
  @Roles('Supervisor', 'Teacher')
  async getClass(@Request() req: any, @Param('id') id: string) {
    const user = req.user;
    return this.getClassUseCase.execute(id, user.role, user.teacherId);
  }

  @Get(':id/sessions')
  @Roles('Supervisor', 'Teacher')
  async listSessionsForClass(@Request() req: any, @Param('id') id: string) {
    const user = req.user;
    return this.listClassSessionsUseCase.execute(user.role, user.teacherId, id);
  }

  @Get('sessions/:sessionId')
  @Roles('Supervisor', 'Teacher')
  async getSession(@Request() req: any, @Param('sessionId') sessionId: string) {
    const user = req.user;
    return this.getClassSessionUseCase.execute(sessionId, user.role, user.teacherId);
  }

  @Patch('sessions/:sessionId/cancel')
  @Roles('Supervisor')
  async cancelSession(@Request() req: any, @Param('sessionId') sessionId: string) {
    const user = req.user;
    return this.cancelClassSessionUseCase.execute(sessionId, user.id);
  }

  @Patch('sessions/:sessionId/teacher')
  @Roles('Supervisor')
  async updateSessionTeacher(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() body: UpdateSessionTeacherDto,
  ) {
    const user = req.user;
    return this.updateClassSessionTeacherUseCase.execute(sessionId, body.actualTeacherId, user.id);
  }
}
