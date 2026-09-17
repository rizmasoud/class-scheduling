import { IsString, IsOptional, IsArray, ValidateNested, IsUUID } from "class-validator";
import { Type } from "class-transformer";

export class UpsertLessonPlanEntryDto {
  @IsUUID()
  sessionId!: string;

  @IsOptional()
  @IsUUID()
  syllabusItemId?: string | null;

  @IsOptional()
  @IsString()
  plannedTopics?: string | null;

  @IsOptional()
  @IsString()
  homeworkAssigned?: string | null;

  @IsOptional()
  @IsString()
  actualTaughtNotes?: string | null;
}

export class SaveLessonPlanDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertLessonPlanEntryDto)
  entries!: UpsertLessonPlanEntryDto[];
}
