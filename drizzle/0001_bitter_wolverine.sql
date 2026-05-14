CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'storing', 'done', 'failed', 'cancelled');--> statement-breakpoint
ALTER TABLE "job" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."job_status";--> statement-breakpoint
ALTER TABLE "job" ALTER COLUMN "status" SET DATA TYPE "public"."job_status" USING "status"::"public"."job_status";