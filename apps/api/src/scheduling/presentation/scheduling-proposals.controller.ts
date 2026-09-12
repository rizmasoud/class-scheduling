import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@class-scheduling/contracts';
import { GenerateSchedulingProposalUseCase } from '../application/generate-scheduling-proposal.use-case';
import { GetSchedulingProposalUseCase } from '../application/get-scheduling-proposal.use-case';
import { ListSchedulingProposalsUseCase } from '../application/list-scheduling-proposals.use-case';
import { UpdateSchedulingProposalStatusUseCase } from '../application/update-scheduling-proposal-status.use-case';
import { MaterializeProposalUseCase } from '../application/materialize-proposal.use-case';
import { SchedulingProposalDetailDTO, ProposalSummaryDTO, SchedulingProposalStatus } from '@class-scheduling/contracts';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsIn } from 'class-validator';

export class GenerateSchedulingProposalDto {
  @IsString()
  @IsNotEmpty()
  termId!: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class UpdateProposalStatusDto {
  @IsIn(['Draft', 'Committed', 'Archived'])
  status!: SchedulingProposalStatus;
}

@Controller('scheduling-proposals')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SchedulingProposalsController {
  constructor(
    private readonly generateUseCase: GenerateSchedulingProposalUseCase,
    private readonly getUseCase: GetSchedulingProposalUseCase,
    private readonly listUseCase: ListSchedulingProposalsUseCase,
    private readonly updateStatusUseCase: UpdateSchedulingProposalStatusUseCase,
    private readonly materializeUseCase: MaterializeProposalUseCase,
  ) {}

  @Post()
  @Roles('Supervisor')
  async generateProposal(
    @Body() request: GenerateSchedulingProposalDto,
  ): Promise<SchedulingProposalDetailDTO> {
    return this.generateUseCase.execute(request);
  }

  @Get()
  @Roles('Supervisor')
  async listProposals(
    @Query('termId') termId?: string,
  ): Promise<ProposalSummaryDTO[]> {
    return this.listUseCase.execute(termId);
  }

  @Get(':id')
  @Roles('Supervisor')
  async getProposal(
    @Param('id') id: string,
  ): Promise<SchedulingProposalDetailDTO> {
    return this.getUseCase.execute(id);
  }

  @Patch(':id/status')
  @Roles('Supervisor')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateProposalStatusDto,
  ): Promise<ProposalSummaryDTO> {
    return this.updateStatusUseCase.execute(id, body.status);
  }

  @Post(':id/materialize')
  @Roles('Supervisor')
  async materialize(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.materializeUseCase.execute(id, req.user?.id);
  }
}
