-- ============================================================
-- Migration: init_hrms_schema
-- Created by: Prisma Migrate
-- ============================================================

-- Enums

CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin', 'employee');
CREATE TYPE "EmploymentType" AS ENUM ('full_time', 'part_time', 'contract');
CREATE TYPE "SalaryType" AS ENUM ('monthly', 'annual');
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'half_day', 'leave', 'weekend');
CREATE TYPE "LeaveStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "PayrollStatus" AS ENUM ('pending', 'paid');

-- Table: companies

CREATE TABLE "companies" (
  "id"                  SERIAL PRIMARY KEY,
  "name"                VARCHAR(200)  NOT NULL,
  "email"               VARCHAR(200)  NOT NULL,
  "phone"               VARCHAR(50),
  "website"             VARCHAR(200),
  "address_line"        VARCHAR(300),
  "city"                VARCHAR(100),
  "state"               VARCHAR(100),
  "country"             VARCHAR(100),
  "zip_code"            VARCHAR(20),
  "industry"            VARCHAR(100),
  "company_size"        VARCHAR(50),
  "registration_number" VARCHAR(100),
  "founded"             VARCHAR(10),
  "description"         TEXT,
  "logo_url"            VARCHAR(500),
  "theme"               VARCHAR(1000),
  "is_active"           BOOLEAN       NOT NULL DEFAULT TRUE,
  "created_at"          TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "companies_email_key" UNIQUE ("email")
);

-- Table: users

CREATE TABLE "users" (
  "id"          SERIAL PRIMARY KEY,
  "name"        VARCHAR(200)  NOT NULL,
  "email"       VARCHAR(200)  NOT NULL,
  "password"    VARCHAR(300)  NOT NULL,
  "role"        "UserRole"    NOT NULL,
  "company_id"  INTEGER,
  "phone"       VARCHAR(50),
  "address"     TEXT,
  "is_active"   BOOLEAN       NOT NULL DEFAULT TRUE,
  "last_login"  TIMESTAMP(3),
  "created_at"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_email_key" UNIQUE ("email"),
  CONSTRAINT "users_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL
);

-- Table: employees

CREATE TABLE "employees" (
  "id"              SERIAL PRIMARY KEY,
  "user_id"         INTEGER         NOT NULL,
  "company_id"      INTEGER         NOT NULL,
  "employee_code"   VARCHAR(50),
  "department"      VARCHAR(100),
  "position"        VARCHAR(100),
  "employment_type" "EmploymentType" NOT NULL DEFAULT 'full_time',
  "work_location"   VARCHAR(150),
  "date_of_birth"   DATE,
  "date_of_joining" DATE,
  "gender"          VARCHAR(20),
  "salary"          DECIMAL(12, 2),
  "salary_type"     "SalaryType"    NOT NULL DEFAULT 'annual',
  "currency"        VARCHAR(10)     NOT NULL DEFAULT 'USD',
  "bank_account"    VARCHAR(100),
  "profile_pic"     VARCHAR(500),
  "is_active"       BOOLEAN         NOT NULL DEFAULT TRUE,
  "created_at"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employees_user_id_key"     UNIQUE ("user_id"),
  CONSTRAINT "employees_employee_code_key" UNIQUE ("employee_code"),
  CONSTRAINT "employees_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "employees_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
);

-- Table: emergency_contacts

CREATE TABLE "emergency_contacts" (
  "id"              SERIAL PRIMARY KEY,
  "employee_id"     INTEGER       NOT NULL,
  "contact_name"    VARCHAR(200)  NOT NULL,
  "relationship"    VARCHAR(100),
  "phone"           VARCHAR(50),
  "alternate_phone" VARCHAR(50),
  "address"         TEXT,
  "created_at"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "emergency_contacts_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
);

-- Table: attendance

CREATE TABLE "attendance" (
  "id"             SERIAL PRIMARY KEY,
  "employee_id"    INTEGER           NOT NULL,
  "company_id"     INTEGER           NOT NULL,
  "date"           DATE              NOT NULL,
  "check_in_time"  TIMESTAMP(3),
  "check_out_time" TIMESTAMP(3),
  "status"         "AttendanceStatus" NOT NULL DEFAULT 'present',
  "notes"          TEXT,
  "created_at"     TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attendance_employee_id_date_key" UNIQUE ("employee_id", "date"),
  CONSTRAINT "attendance_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
  CONSTRAINT "attendance_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
);

-- Table: leaves

CREATE TABLE "leaves" (
  "id"          SERIAL PRIMARY KEY,
  "employee_id" INTEGER       NOT NULL,
  "company_id"  INTEGER       NOT NULL,
  "leave_type"  VARCHAR(50)   NOT NULL,
  "from_date"   DATE          NOT NULL,
  "to_date"     DATE          NOT NULL,
  "days"        INTEGER       NOT NULL DEFAULT 1,
  "reason"      TEXT,
  "status"      "LeaveStatus" NOT NULL DEFAULT 'pending',
  "reviewed_by" INTEGER,
  "review_note" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "applied_on"  DATE          NOT NULL DEFAULT CURRENT_DATE,
  "created_at"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "leaves_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
  CONSTRAINT "leaves_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
  CONSTRAINT "leaves_reviewed_by_fkey"
    FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Table: payroll

CREATE TABLE "payroll" (
  "id"          SERIAL PRIMARY KEY,
  "employee_id" INTEGER         NOT NULL,
  "company_id"  INTEGER         NOT NULL,
  "month"       VARCHAR(7)      NOT NULL,
  "basic"       DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  "hra"         DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  "allowances"  DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  "bonus"       DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  "deductions"  DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  "tax"         DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  "net_pay"     DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  "status"      "PayrollStatus" NOT NULL DEFAULT 'pending',
  "paid_on"     DATE,
  "created_at"  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payroll_employee_id_month_key" UNIQUE ("employee_id", "month"),
  CONSTRAINT "payroll_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
  CONSTRAINT "payroll_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
);

-- Indexes

CREATE UNIQUE INDEX "companies_email_key"      ON "companies"("email");
CREATE UNIQUE INDEX "users_email_key"          ON "users"("email");
CREATE INDEX "users_company_id_idx"            ON "users"("company_id");
CREATE UNIQUE INDEX "employees_user_id_key"    ON "employees"("user_id");
CREATE INDEX "employees_company_id_idx"        ON "employees"("company_id");
CREATE INDEX "emergency_contacts_employee_id_idx" ON "emergency_contacts"("employee_id");
CREATE UNIQUE INDEX "attendance_employee_date_key" ON "attendance"("employee_id", "date");
CREATE INDEX "attendance_employee_id_idx"      ON "attendance"("employee_id");
CREATE INDEX "attendance_date_idx"             ON "attendance"("date");
CREATE INDEX "leaves_employee_id_idx"          ON "leaves"("employee_id");
CREATE INDEX "leaves_status_idx"               ON "leaves"("status");
CREATE UNIQUE INDEX "payroll_employee_month_key" ON "payroll"("employee_id", "month");
CREATE INDEX "payroll_employee_id_idx"         ON "payroll"("employee_id");
