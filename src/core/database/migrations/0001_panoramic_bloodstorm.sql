CREATE TABLE `proposal_unscheduled_students` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_id` text NOT NULL,
	`student_id` text NOT NULL,
	`reasons` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `proposal_classes` ADD `student_ids` text DEFAULT '[]' NOT NULL;