CREATE TABLE "proposal_class_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_class_id" uuid NOT NULL,
	"week_day" varchar(50) NOT NULL,
	"start_time" varchar(50) NOT NULL,
	"end_time" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_class_students" (
	"proposal_class_id" uuid NOT NULL,
	"student_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"teacher_id" uuid,
	"generated_name" varchar(255) NOT NULL,
	"custom_name" varchar(255),
	"score" integer NOT NULL,
	"reasons" jsonb NOT NULL,
	"edited_by_supervisor" boolean DEFAULT false NOT NULL,
	"status" varchar(50) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "proposal_unscheduled_students" (
	"proposal_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"reasons" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduling_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"configuration_snapshot" jsonb NOT NULL,
	"notes" text,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposal_class_schedules" ADD CONSTRAINT "proposal_class_schedules_proposal_class_id_proposal_classes_id_fk" FOREIGN KEY ("proposal_class_id") REFERENCES "public"."proposal_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_class_students" ADD CONSTRAINT "proposal_class_students_proposal_class_id_proposal_classes_id_fk" FOREIGN KEY ("proposal_class_id") REFERENCES "public"."proposal_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_class_students" ADD CONSTRAINT "proposal_class_students_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_classes" ADD CONSTRAINT "proposal_classes_proposal_id_scheduling_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."scheduling_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_classes" ADD CONSTRAINT "proposal_classes_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_classes" ADD CONSTRAINT "proposal_classes_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_unscheduled_students" ADD CONSTRAINT "proposal_unscheduled_students_proposal_id_scheduling_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."scheduling_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_unscheduled_students" ADD CONSTRAINT "proposal_unscheduled_students_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduling_proposals" ADD CONSTRAINT "scheduling_proposals_term_id_academic_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "draft_proposal_term_idx" ON "scheduling_proposals" USING btree ("term_id") WHERE status = 'Draft';