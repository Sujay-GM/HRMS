-- ============================================================
-- HRMS DATABASE SCHEMA (ENHANCED)
-- ============================================================

DROP TABLE IF EXISTS payroll CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

CREATE TABLE companies (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(200) NOT NULL,
  email               VARCHAR(200) UNIQUE NOT NULL,
  phone               VARCHAR(50),
  website             VARCHAR(200),
  address_line        VARCHAR(300),
  city                VARCHAR(100),
  state               VARCHAR(100),
  country             VARCHAR(100),
  zip_code            VARCHAR(20),
  industry            VARCHAR(100),
  company_size        VARCHAR(50),
  registration_number VARCHAR(100),
  founded             VARCHAR(10),
  description         TEXT,
  logo_url            VARCHAR(500),
  theme               VARCHAR(1000),
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  email       VARCHAR(200) UNIQUE NOT NULL,
  password    VARCHAR(300) NOT NULL,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'employee')),
  company_id  INTEGER REFERENCES companies(id) ON DELETE SET NULL,
  phone       VARCHAR(50),
  address     TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  last_login  TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employees (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_id        INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_code     VARCHAR(50) UNIQUE,
  department        VARCHAR(100),
  position          VARCHAR(100),
  employment_type   VARCHAR(30) DEFAULT 'full_time' CHECK (employment_type IN ('full_time','part_time','contract')),
  work_location     VARCHAR(150),
  date_of_birth     DATE,
  date_of_joining   DATE,
  gender            VARCHAR(20),
  salary            DECIMAL(12,2),
  salary_type       VARCHAR(20) DEFAULT 'annual' CHECK (salary_type IN ('monthly','annual')),
  currency          VARCHAR(10) DEFAULT 'USD',
  bank_account      VARCHAR(100),
  profile_pic       VARCHAR(500),
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE emergency_contacts (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contact_name    VARCHAR(200) NOT NULL,
  relationship    VARCHAR(100),
  phone           VARCHAR(50),
  alternate_phone VARCHAR(50),
  address         TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attendance (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_id    INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  status        VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present','absent','half-day','leave','weekend')),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

CREATE TABLE leaves (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  leave_type  VARCHAR(50) NOT NULL,
  from_date   DATE NOT NULL,
  to_date     DATE NOT NULL,
  days        INTEGER NOT NULL DEFAULT 1,
  reason      TEXT,
  status      VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by INTEGER REFERENCES users(id),
  review_note TEXT,
  reviewed_at TIMESTAMP,
  applied_on  DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payroll (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  month       VARCHAR(7) NOT NULL,
  basic       DECIMAL(12,2) DEFAULT 0,
  hra         DECIMAL(12,2) DEFAULT 0,
  allowances  DECIMAL(12,2) DEFAULT 0,
  bonus       DECIMAL(12,2) DEFAULT 0,
  deductions  DECIMAL(12,2) DEFAULT 0,
  tax         DECIMAL(12,2) DEFAULT 0,
  net_pay     DECIMAL(12,2) DEFAULT 0,
  status      VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_on     DATE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, month)
);

CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_users_company      ON users(company_id);
CREATE INDEX idx_employees_company  ON employees(company_id);
CREATE INDEX idx_attendance_emp     ON attendance(employee_id);
CREATE INDEX idx_attendance_date    ON attendance(date);
CREATE INDEX idx_leaves_employee    ON leaves(employee_id);
CREATE INDEX idx_leaves_status      ON leaves(status);
CREATE INDEX idx_payroll_employee   ON payroll(employee_id);
CREATE INDEX idx_ec_employee        ON emergency_contacts(employee_id);

-- ============================================================
-- SEED DATA
-- admin123 / emp123 hashes
-- ============================================================

INSERT INTO companies (name, email, phone, address_line, city, state, country, zip_code, industry, company_size, website, founded, description) VALUES
('TechCorp Inc',  'info@techcorp.com',      '+1-555-0101', '123 Silicon Valley Blvd', 'San Jose',  'CA', 'USA', '94025', 'Technology', '51-200',  'https://techcorp.com',   '2018', 'A leading technology company.'),
('FinanceHub',    'contact@financehub.com', '+1-555-0102', '456 Wall Street',         'New York',  'NY', 'USA', '10005', 'Finance',    '201-500', 'https://financehub.com', '2015', 'Premier financial services firm.'),
('RetailPlus',    'hello@retailplus.com',   '+1-555-0103', '789 Commerce Blvd',       'Dallas',    'TX', 'USA', '75001', 'Retail',     '51-200',  'https://retailplus.com', '2019', 'Leading retail chain.'),
('MediCare Ltd',  'care@medicare.com',      '+1-555-0104', '321 Health Ave',          'Miami',     'FL', 'USA', '33101', 'Healthcare', '201-500', 'https://medicare.com',   '2016', 'Healthcare solutions provider.');

INSERT INTO users (name, email, password, role) VALUES
('Super Admin', 'superadmin@hrms.com', '$2a$10$wybNItkoYZKZRx0Y9Bsk2OwgQCKN4u34fISduhGmIcSTQqo7JkR4q', 'super_admin');

INSERT INTO users (name, email, password, role, company_id) VALUES
('Alice Johnson', 'admin@techcorp.com',    '$2a$10$wybNItkoYZKZRx0Y9Bsk2OwgQCKN4u34fISduhGmIcSTQqo7JkR4q', 'admin', 1),
('Bob Martinez',  'admin@financehub.com', '$2a$10$wybNItkoYZKZRx0Y9Bsk2OwgQCKN4u34fISduhGmIcSTQqo7JkR4q', 'admin', 2),
('Carol White',   'admin@retailplus.com', '$2a$10$wybNItkoYZKZRx0Y9Bsk2OwgQCKN4u34fISduhGmIcSTQqo7JkR4q', 'admin', 3);

INSERT INTO users (name, email, password, role, company_id) VALUES
('David Kim',       'david@techcorp.com',   '$2a$10$o13GyCzTS0ko9QSrsvv8v.SNm51AqH7r1OeaA1qEpxtEgEONxwKMm', 'employee', 1),
('Emma Chen',       'emma@techcorp.com',    '$2a$10$o13GyCzTS0ko9QSrsvv8v.SNm51AqH7r1OeaA1qEpxtEgEONxwKMm', 'employee', 1),
('Frank Rodriguez', 'frank@techcorp.com',   '$2a$10$o13GyCzTS0ko9QSrsvv8v.SNm51AqH7r1OeaA1qEpxtEgEONxwKMm', 'employee', 1),
('Grace Patel',     'grace@financehub.com', '$2a$10$o13GyCzTS0ko9QSrsvv8v.SNm51AqH7r1OeaA1qEpxtEgEONxwKMm', 'employee', 2),
('Henry Wilson',    'henry@financehub.com', '$2a$10$o13GyCzTS0ko9QSrsvv8v.SNm51AqH7r1OeaA1qEpxtEgEONxwKMm', 'employee', 2);

INSERT INTO employees (user_id, company_id, employee_code, department, position, employment_type, work_location, date_of_birth, date_of_joining, gender, salary, salary_type, currency) VALUES
((SELECT id FROM users WHERE email='david@techcorp.com'),   1, 'EMP001', 'Engineering', 'Senior Developer',     'full_time', 'San Jose HQ',  '1990-05-15', '2022-01-15', 'male',   95000, 'annual', 'USD'),
((SELECT id FROM users WHERE email='emma@techcorp.com'),    1, 'EMP002', 'Design',      'UX Designer',          'full_time', 'San Jose HQ',  '1993-08-22', '2022-03-10', 'female', 75000, 'annual', 'USD'),
((SELECT id FROM users WHERE email='frank@techcorp.com'),   1, 'EMP003', 'Marketing',   'Marketing Manager',    'full_time', 'Remote',       '1988-11-30', '2021-11-20', 'male',   80000, 'annual', 'USD'),
((SELECT id FROM users WHERE email='grace@financehub.com'), 2, 'EMP004', 'HR',          'HR Lead',              'full_time', 'New York HQ',  '1991-03-18', '2023-02-01', 'female', 72000, 'annual', 'USD'),
((SELECT id FROM users WHERE email='henry@financehub.com'), 2, 'EMP005', 'Sales',       'Sales Representative', 'full_time', 'New York HQ',  '1995-07-25', '2023-06-15', 'male',   65000, 'annual', 'USD');

INSERT INTO emergency_contacts (employee_id, contact_name, relationship, phone, alternate_phone, address) VALUES
(1, 'Sarah Kim',       'Spouse',  '+1-555-1001', '+1-555-1002', '123 Home St, San Jose, CA'),
(2, 'Michael Chen',    'Brother', '+1-555-1003', NULL,          '456 Family Ave, San Jose, CA'),
(3, 'Maria Rodriguez', 'Mother',  '+1-555-1004', '+1-555-1005', '789 Parent Blvd, Dallas, TX');

INSERT INTO attendance (employee_id, company_id, date, check_in_time, check_out_time, status) VALUES
(1, 1, CURRENT_DATE,     NOW() - INTERVAL '9 hours', NOW() - INTERVAL '1 hour',  'present'),
(1, 1, CURRENT_DATE - 1, NOW() - INTERVAL '33 hours', NOW() - INTERVAL '24 hours', 'present'),
(1, 1, CURRENT_DATE - 2, NULL, NULL, 'absent'),
(2, 1, CURRENT_DATE,     NOW() - INTERVAL '8 hours', NULL, 'present'),
(2, 1, CURRENT_DATE - 1, NOW() - INTERVAL '32 hours', NOW() - INTERVAL '24 hours', 'present'),
(3, 1, CURRENT_DATE,     NOW() - INTERVAL '8 hours', NOW() - INTERVAL '1 hour', 'present'),
(4, 2, CURRENT_DATE,     NOW() - INTERVAL '9 hours', NOW() - INTERVAL '2 hours', 'present'),
(5, 2, CURRENT_DATE,     NULL, NULL, 'absent');

INSERT INTO leaves (employee_id, company_id, leave_type, from_date, to_date, days, reason, status) VALUES
(1, 1, 'Annual Leave',   CURRENT_DATE + 7,  CURRENT_DATE + 11, 5, 'Family vacation', 'pending'),
(2, 1, 'Sick Leave',     CURRENT_DATE - 5,  CURRENT_DATE - 4,  2, 'Fever and cold',  'approved'),
(3, 1, 'Personal Leave', CURRENT_DATE - 10, CURRENT_DATE - 10, 1, 'Personal errand', 'rejected'),
(4, 2, 'Annual Leave',   CURRENT_DATE + 14, CURRENT_DATE + 18, 5, 'Vacation',        'pending');

INSERT INTO payroll (employee_id, company_id, month, basic, hra, allowances, bonus, deductions, tax, net_pay, status, paid_on) VALUES
(1, 1, TO_CHAR(CURRENT_DATE,'YYYY-MM'), 7917, 1583, 500, 0,    791, 420, 8789, 'paid',    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '30 days')::DATE),
(2, 1, TO_CHAR(CURRENT_DATE,'YYYY-MM'), 6250, 1250, 400, 0,    625, 310, 6965, 'paid',    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '30 days')::DATE),
(3, 1, TO_CHAR(CURRENT_DATE,'YYYY-MM'), 6667, 1333, 450, 500,  667, 350, 7933, 'pending', NULL),
(4, 2, TO_CHAR(CURRENT_DATE,'YYYY-MM'), 6000, 1200, 400, 0,    600, 300, 6700, 'paid',    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '30 days')::DATE),
(5, 2, TO_CHAR(CURRENT_DATE,'YYYY-MM'), 5417, 1083, 350, 1000, 542, 270, 7038, 'pending', NULL);
