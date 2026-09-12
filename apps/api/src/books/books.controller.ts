import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { BooksService } from './books.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsInt()
  @Min(0)
  sequenceOrder!: number;

  @IsInt()
  @Min(1)
  sessionCount!: number;
}

class UpdateBookDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sequenceOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sessionCount?: number;
}

class SyllabusItemDto {
  @IsInt()
  @Min(1)
  sessionNumber!: number;

  @IsString()
  @IsNotEmpty()
  topic!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateSyllabusItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  sessionNumber?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  topic?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller('books')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @Roles('Supervisor')
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Get()
  @Roles('Supervisor', 'Teacher')
  findAll() {
    return this.booksService.findAll();
  }

  @Get(':id')
  @Roles('Supervisor', 'Teacher')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @Roles('Supervisor')
  update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  // Syllabus
  @Get(':id/syllabus')
  @Roles('Supervisor', 'Teacher')
  getSyllabus(@Param('id') id: string) {
    return this.booksService.getSyllabus(id);
  }

  @Post(':id/syllabus')
  @Roles('Supervisor')
  createSyllabusItem(@Param('id') id: string, @Body() dto: SyllabusItemDto) {
    return this.booksService.createSyllabusItem(id, dto);
  }

  @Patch('syllabus/:itemId')
  @Roles('Supervisor')
  updateSyllabusItem(@Param('itemId') itemId: string, @Body() dto: UpdateSyllabusItemDto) {
    return this.booksService.updateSyllabusItem(itemId, dto);
  }

  @Delete('syllabus/:itemId')
  @Roles('Supervisor')
  deleteSyllabusItem(@Param('itemId') itemId: string) {
    return this.booksService.deleteSyllabusItem(itemId);
  }
}
