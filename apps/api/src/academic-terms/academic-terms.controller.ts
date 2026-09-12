import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { AcademicTermsService } from './academic-terms.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { IsString, IsNotEmpty, IsIn, IsDateString, IsOptional } from 'class-validator';
import { AcademicTermStatus } from '@class-scheduling/contracts';

class CreateTermDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsIn(['Draft', 'Active', 'Completed', 'Archived'])
  status!: AcademicTermStatus;
}

class UpdateTermDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['Draft', 'Active', 'Completed', 'Archived'])
  status?: AcademicTermStatus;
}

@Controller('academic-terms')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AcademicTermsController {
  constructor(private readonly termsService: AcademicTermsService) {}

  @Post()
  @Roles('Supervisor')
  create(@Body() dto: CreateTermDto) {
    return this.termsService.create(dto);
  }

  @Get()
  @Roles('Supervisor', 'Teacher')
  findAll() {
    return this.termsService.findAll();
  }

  @Get(':id')
  @Roles('Supervisor', 'Teacher')
  findOne(@Param('id') id: string) {
    return this.termsService.findOne(id);
  }

  @Patch(':id')
  @Roles('Supervisor')
  update(@Param('id') id: string, @Body() dto: UpdateTermDto) {
    return this.termsService.update(id, dto);
  }
}
