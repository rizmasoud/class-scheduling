CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`level` real NOT NULL,
	`sequence_order` integer DEFAULT 0 NOT NULL,
	`session_count` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE TABLE `class_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`week_day` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `class_students` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`student_id` text NOT NULL,
	`enrollment_status` text DEFAULT 'Active' NOT NULL,
	`joined_at` text NOT NULL,
	`left_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`book_id` text NOT NULL,
	`teacher_id` text,
	`status` text DEFAULT 'Draft' NOT NULL,
	`min_capacity` integer DEFAULT 8 NOT NULL,
	`target_capacity` integer DEFAULT 12 NOT NULL,
	`max_capacity` integer DEFAULT 15 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE TABLE `exam_results` (
	`id` text PRIMARY KEY NOT NULL,
	`class_student_id` text NOT NULL,
	`score` integer NOT NULL,
	`result_status` text NOT NULL,
	`supervisor_decision` text,
	`exam_date` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`current_book_id` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE TABLE `student_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`available_day_pattern` text NOT NULL,
	`unavailable_time_ranges` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teacher_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`unavailable_day_pattern` text,
	`unavailable_time_ranges` text,
	`max_weekly_sessions` integer,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teacher_preferences_teacher_id_unique` ON `teacher_preferences` (`teacher_id`);--> statement-breakpoint
CREATE TABLE `teacher_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`book_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teacher_attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`schedule_id` text NOT NULL,
	`attendance_date` text NOT NULL,
	`is_present` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scheduling_proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`generated_at` text NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE TABLE `proposal_classes` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_id` text NOT NULL,
	`book_id` text NOT NULL,
	`teacher_id` text,
	`generated_name` text NOT NULL,
	`custom_name` text,
	`score` integer NOT NULL,
	`reasons` text NOT NULL,
	`student_ids` text DEFAULT '[]' NOT NULL,
	`edited_by_supervisor` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `proposal_class_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_class_id` text NOT NULL,
	`week_day` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
