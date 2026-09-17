import { LessonPlansModule } from './lesson-plans/lesson-plans.module';
import { Module } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AcademicTermsModule } from './academic-terms/academic-terms.module';
import { BooksModule } from './books/books.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { SchedulingModule } from './scheduling/scheduling.module';

@Module({
  imports: [
    DatabaseModule, 
    AuthModule, 
    UsersModule,
    AcademicTermsModule,
    BooksModule,
    StudentsModule,
    TeachersModule,
    SchedulingModule,
    LessonPlansModule,
  ],
})
export class AppModule {}
