import { Module } from '@nestjs/common';
import { SchedulingProposalsController } from './presentation/scheduling-proposals.controller';
import { GenerateSchedulingProposalUseCase } from './application/generate-scheduling-proposal.use-case';
import { GetSchedulingProposalUseCase } from './application/get-scheduling-proposal.use-case';
import { ListSchedulingProposalsUseCase } from './application/list-scheduling-proposals.use-case';
import { UpdateSchedulingProposalStatusUseCase } from './application/update-scheduling-proposal-status.use-case';
import { MaterializeProposalUseCase } from './application/materialize-proposal.use-case';
import { GetClassUseCase } from './application/get-class.use-case';
import { ListClassesUseCase } from './application/list-classes.use-case';
import { GetClassSessionUseCase } from './application/get-class-session.use-case';
import { ListClassSessionsUseCase } from './application/list-class-sessions.use-case';
import { CancelClassSessionUseCase } from './application/cancel-class-session.use-case';
import { UpdateClassSessionTeacherUseCase } from './application/update-class-session-teacher.use-case';
import { ClassesController } from './presentation/classes.controller';
import { AttendanceController } from './presentation/attendance.controller';
import { SubstitutionController } from './presentation/substitution.controller';
import { SubmitAttendanceUseCase } from './application/submit-attendance.use-case';
import { CreateSubstitutionRequestUseCase } from './application/create-substitution-request.use-case';
import { ClaimBroadcastSubstitutionUseCase } from './application/claim-broadcast-substitution.use-case';
import { ApproveSubstitutionUseCase } from './application/approve-substitution.use-case';
import { GetEligibleSubstitutesUseCase } from './application/get-eligible-substitutes.use-case';
import { AssignEmergencySubstitutionUseCase } from './application/assign-emergency-substitution.use-case';
import { ListSubstitutionRequestsUseCase } from './application/list-substitution-requests.use-case';
import { ListTeacherAttendanceUseCase } from './application/list-teacher-attendance.use-case';
import { SyncSchedulingRunner } from './infrastructure/sync-scheduling.runner';
import { ISchedulingRunner } from './application/i-scheduling-runner.port';
import { ISchedulingContextLoader } from './application/i-scheduling-context-loader.port';
import { SchedulingContextLoader } from './infrastructure/scheduling-context-loader';
import { DatabaseModule } from '../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [
    SchedulingProposalsController, 
    ClassesController,
    AttendanceController,
    SubstitutionController
  ],
  providers: [
    GenerateSchedulingProposalUseCase,
    GetSchedulingProposalUseCase,
    ListSchedulingProposalsUseCase,
    UpdateSchedulingProposalStatusUseCase,
    MaterializeProposalUseCase,
    GetClassUseCase,
    ListClassesUseCase,
    GetClassSessionUseCase,
    ListClassSessionsUseCase,
    CancelClassSessionUseCase,
    UpdateClassSessionTeacherUseCase,
    SubmitAttendanceUseCase,
    CreateSubstitutionRequestUseCase,
    ClaimBroadcastSubstitutionUseCase,
    ApproveSubstitutionUseCase,
    GetEligibleSubstitutesUseCase,
    AssignEmergencySubstitutionUseCase,
    ListSubstitutionRequestsUseCase,
    ListTeacherAttendanceUseCase,
    {
      provide: ISchedulingRunner,
      useClass: SyncSchedulingRunner,
    },
    {
      provide: ISchedulingContextLoader,
      useClass: SchedulingContextLoader,
    },
  ],
  exports: [
    GenerateSchedulingProposalUseCase,
    GetSchedulingProposalUseCase,
    ListSchedulingProposalsUseCase,
    UpdateSchedulingProposalStatusUseCase,
    MaterializeProposalUseCase,
    ISchedulingRunner,
  ],
})
export class SchedulingModule {}
