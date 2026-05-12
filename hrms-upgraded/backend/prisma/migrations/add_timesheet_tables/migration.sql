-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('completed', 'in_progress', 'pending');

-- CreateEnum
CREATE TYPE "TimesheetApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "timesheets" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "week_start" DATE NOT NULL,
    "week_end" DATE NOT NULL,
    "total_hours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheet_entries" (
    "id" SERIAL NOT NULL,
    "timesheet_id" INTEGER,
    "employee_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "hours" DECIMAL(4,2) NOT NULL,
    "task_title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "project" VARCHAR(200),
    "category" VARCHAR(100) NOT NULL DEFAULT 'Development',
    "status" "TimesheetStatus" NOT NULL DEFAULT 'completed',
    "approval_status" "TimesheetApprovalStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timesheet_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "timesheets_employee_id_week_start_key" ON "timesheets"("employee_id", "week_start");
CREATE INDEX "timesheets_company_id_idx" ON "timesheets"("company_id");
CREATE INDEX "timesheets_week_start_idx" ON "timesheets"("week_start");
CREATE INDEX "timesheet_entries_employee_id_idx" ON "timesheet_entries"("employee_id");
CREATE INDEX "timesheet_entries_date_idx" ON "timesheet_entries"("date");
CREATE INDEX "timesheet_entries_approval_status_idx" ON "timesheet_entries"("approval_status");

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "timesheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
