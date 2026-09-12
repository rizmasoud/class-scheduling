import { Controller, Post, Patch, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateSubstitutionRequestUseCase } from '../application/create-substitution-request.use-case';
import { ClaimBroadcastSubstitutionUseCase } from '../application/claim-broadcast-substitution.use-case';
import { ApproveSubstitutionUseCase } from '../application/approve-substitution.use-case';
import { GetEligibleSubstitutesUseCase } from '../application/get-eligible-substitutes.use-case';
import { AssignEmergencySubstitutionUseCase } from '../application/assign-emergency-substitution.use-case';
import { ListSubstitutionRequestsUseCase } from '../application/list-substitution-requests.use-case';
import { CreateSubstitutionRequestDTO } from '@class-scheduling/contracts';

@Controller('substitution-requests')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SubstitutionController {
  constructor(
    private createSubUseCase: CreateSubstitutionRequestUseCase,
    private claimSubUseCase: ClaimBroadcastSubstitutionUseCase,
    private approveSubUseCase: ApproveSubstitutionUseCase,
    private getEligibleSubstitutesUseCase: GetEligibleSubstitutesUseCase,
    private assignEmergencySubUseCase: AssignEmergencySubstitutionUseCase,
    private listSubRequestsUseCase: ListSubstitutionRequestsUseCase,
  ) {}

  @Get()
  @Roles('Teacher', 'Supervisor')
  async listRequests(
    @Query('sessionId') sessionId: string | undefined,
    @Query('status') status: string | undefined,
    @Request() req: any,
  ) {
    return this.listSubRequestsUseCase.execute(req.user.userId, req.user.role, {
      sessionId,
      status,
    });
  }

  @Get('sessions/:sessionId/eligible-teachers')
  @Roles('Teacher', 'Supervisor')
  async getEligibleTeachers(@Param('sessionId') sessionId: string) {
    return this.getEligibleSubstitutesUseCase.execute(sessionId);
  }

  @Post('sessions/:sessionId')
  @Roles('Teacher', 'Supervisor')
  async createRequest(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateSubstitutionRequestDTO,
    @Request() req: any,
  ) {
    return this.createSubUseCase.execute(sessionId, req.user.userId, req.user.role, dto);
  }

  @Post('sessions/:sessionId/emergency')
  @Roles('Supervisor')
  async assignEmergency(
    @Param('sessionId') sessionId: string,
    @Body() dto: { substituteTeacherId: string; reason?: string },
    @Request() req: any,
  ) {
    return this.assignEmergencySubUseCase.execute(
      sessionId,
      dto.substituteTeacherId,
      req.user.userId,
      dto.reason,
    );
  }

  @Post(':id/claim')
  @Roles('Teacher')
  async claimRequest(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.claimSubUseCase.execute(id, req.user.userId);
  }

  @Patch(':id/approve')
  @Roles('Supervisor')
  async approveRequest(
    @Param('id') id: string,
    @Body() dto: { approved: boolean },
    @Request() req: any,
  ) {
    return this.approveSubUseCase.execute(id, req.user.userId, dto.approved);
  }
}
