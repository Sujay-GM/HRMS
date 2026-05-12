-- Migration: 20240003_add_indexes
-- Ensures all performance indexes exist (safe: CREATE INDEX IF NOT EXISTS)

CREATE INDEX IF NOT EXISTS "users_company_id_idx"
  ON "users"("company_id");

CREATE INDEX IF NOT EXISTS "employees_company_id_idx"
  ON "employees"("company_id");

CREATE INDEX IF NOT EXISTS "emergency_contacts_employee_id_idx"
  ON "emergency_contacts"("employee_id");

CREATE INDEX IF NOT EXISTS "attendance_employee_id_idx"
  ON "attendance"("employee_id");

CREATE INDEX IF NOT EXISTS "attendance_date_idx"
  ON "attendance"("date");

CREATE INDEX IF NOT EXISTS "leaves_employee_id_idx"
  ON "leaves"("employee_id");

CREATE INDEX IF NOT EXISTS "leaves_status_idx"
  ON "leaves"("status");

CREATE INDEX IF NOT EXISTS "payroll_employee_id_idx"
  ON "payroll"("employee_id");
