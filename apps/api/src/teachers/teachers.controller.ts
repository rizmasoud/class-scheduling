import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseRatePerSession?: number;
}

class AddSkillDto {
  @IsString()
  @IsNotEmpty()
  bookId!: string;
}

@Controller('teachers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles('Supervisor', 'Teacher')
  findAll() {
    return this.teachersService.findAll();
  }

  @Get(':id')
  @Roles('Supervisor', 'Teacher')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @Roles('Supervisor', 'Teacher')
  updateProfile(@Param('id') id: string, @Body() dto: UpdateProfileDto, @Request() req: any) {
    return this.teachersService.updateProfile(id, req.user.userId, req.user.role, dto);
  }

  // Skills
  @Get(':id/skills')
  @Roles('Supervisor', 'Teacher')
  getSkills(@Param('id') id: string) {
    return this.teachersService.getSkills(id);
  }

  @Post(':id/skills')
  @Roles('Supervisor', 'Teacher')
  addSkill(@Param('id') id: string, @Body() dto: AddSkillDto, @Request() req: any) {
    return this.teachersService.addSkill(id, dto.bookId, req.user.userId, req.user.role);
  }

  @Delete(':id/skills/:skillId')
  @Roles('Supervisor', 'Teacher')
  removeSkill(@Param('id') id: string, @Param('skillId') skillId: string, @Request() req: any) {
    return this.teachersService.removeSkill(id, skillId, req.user.userId, req.user.role);
  }
}
