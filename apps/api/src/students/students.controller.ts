import { Controller, Get, Post, Body, Param, Patch, Put, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { IsString, IsNotEmpty, IsOptional, IsIn, IsArray } from 'class-validator';
import { AvailableDayPattern } from '@class-scheduling/contracts';

class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsOptional()
  @IsString()
  externalStudentId?: string;

  @IsOptional()
  @IsString()
  currentBookId?: string;
}

class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @IsOptional()
  @IsString()
  externalStudentId?: string;

  @IsOptional()
  @IsString()
  currentBookId?: string;
}

class UpsertPreferencesDto {
  @IsIn(['Odd', 'Even', 'Both'])
  availableDayPattern!: AvailableDayPattern;

  @IsArray()
  unavailableTimeRanges!: any[]; // Could be typed more strictly
}

@Controller('students')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles('Supervisor')
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  @Roles('Supervisor') // Only supervisor can list all students in this phase
  findAll() {
    return this.studentsService.findAll();
  }

  @Get(':id')
  @Roles('Supervisor', 'Teacher') // A minimal read scope for teacher
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('Supervisor')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  // Preferences
  @Get(':id/preferences')
  @Roles('Supervisor')
  getPreferences(@Param('id') id: string) {
    return this.studentsService.getPreferences(id);
  }

  @Put(':id/preferences')
  @Roles('Supervisor')
  upsertPreferences(@Param('id') id: string, @Body() dto: UpsertPreferencesDto) {
    return this.studentsService.upsertPreferences(id, dto);
  }
}
