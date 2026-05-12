-- ============================================================
-- HRMS SEED DATA — Run this AFTER schema.sql
-- Passwords: admin123 (admins) | emp123 (employees)
-- ============================================================

-- Clear existing data (safe re-run)
TRUNCATE payroll, attendance, leaves, emergency_contacts, employees, users, companies RESTART IDENTITY CASCADE;

-- ============================================================
-- COMPANIES
-- ============================================================
INSERT INTO companies (name, email, phone, address_line, city, state, country, zip_code, industry, company_size, website, founded, description) VALUES
('TechCorp Inc',  'info@techcorp.com',      '+1-555-0101', '123 Silicon Valley Blvd', 'San Jose', 'CA', 'USA', '94025', 'Technology', '51-200',  'https://techcorp.com',   '2018', 'A leading technology company.'),
('FinanceHub',    'contact@financehub.com', '+1-555-0102', '456 Wall Street',         'New York', 'NY', 'USA', '10005', 'Finance',    '201-500', 'https://financehub.com', '2015', 'Premier financial services firm.');

-- ============================================================
-- USERS  (password = admin123 for all admins, emp123 for employees)
-- ============================================================
INSERT INTO users (name, email, password, role) VALUES
('Super Admin', 'superadmin@hrms.com', '$2a$10$wybNItkoYZKZRx0Y9Bsk2OwgQCKN4u34fISduhGmIcSTQqo7JkR4q', 'super_admin');

INSERT INTO users (name, email, password, role, company_id) VALUES
('Alice Johnson', 'admin@techcorp.com',    '$2a$10$wybNItkoYZKZRx0Y9Bsk2OwgQCKN4u34fISduhGmIcSTQqo7JkR4q', 'admin', 1),
('Bob Martinez',  'admin@financehub.com', '$2a$10$wybNItkoYZKZRx0Y9Bsk2OwgQCKN4u34fISduhGmIcSTQqo7JkR4q', 'admin', 2);

INSERT INTO users (name, email, password, role, company_id) VALUES
('David Kim',    'david@techcorp.com',   '$2a$10$o13GyCzTS0ko9QSrsvv8v.SNm51AqH7r1OeaA1qEpxtEgEONxwKMm', 'employee', 1),
('Emma Chen',    'emma@techcorp.com',    '$2a$10$o13GyCzTS0ko9QSrsvv8v.SNm51AqH7r1OeaA1qEpxtEgEONxwKMm', 'employee', 1),
('Frank Lopez',  'frank@techcorp.com',   '$2a$10$o13GyCzTS0ko9QSrsvv8v.SNm51AqH7r1OeaA1qEpxtEgEONxwKMm', 'employee', 1),
('Grace Patel',  'grace@financehub.com', '$2a$10$o13GyCzTS0ko9QSrsvv8v.SNm51AqH7r1OeaA1qEpxtEgEONxwKMm', 'employee', 2),
('Henry Wilson', 'henry@financehub.com', '$2a$10$o13GyCzTS0ko9QSrsvv8v.SNm51AqH7r1OeaA1qEpxtEgEONxwKMm', 'employee', 2);

-- ============================================================
-- EMPLOYEE PROFILES
-- ============================================================
INSERT INTO employees (user_id, company_id, employee_code, department, position, employment_type, work_location, date_of_birth, date_of_joining, gender, salary, salary_type, currency) VALUES
((SELECT id FROM users WHERE email='david@techcorp.com'),    1, 'EMP001', 'Engineering', 'Senior Developer',     'full_time', 'San Jose HQ', '1990-05-15', '2022-01-15', 'male',   95000, 'annual', 'USD'),
((SELECT id FROM users WHERE email='emma@techcorp.com'),     1, 'EMP002', 'Design',      'UX Designer',          'full_time', 'San Jose HQ', '1993-08-22', '2022-03-10', 'female', 75000, 'annual', 'USD'),
((SELECT id FROM users WHERE email='frank@techcorp.com'),    1, 'EMP003', 'Marketing',   'Marketing Manager',    'full_time', 'Remote',      '1988-11-30', '2021-11-20', 'male',   80000, 'annual', 'USD'),
((SELECT id FROM users WHERE email='grace@financehub.com'),  2, 'EMP004', 'HR',          'HR Lead',              'full_time', 'New York HQ', '1991-03-18', '2023-02-01', 'female', 72000, 'annual', 'USD'),
((SELECT id FROM users WHERE email='henry@financehub.com'),  2, 'EMP005', 'Sales',       'Sales Representative', 'full_time', 'New York HQ', '1995-07-25', '2023-06-15', 'male',   65000, 'annual', 'USD');

-- ============================================================
-- EMERGENCY CONTACTS
-- ============================================================
INSERT INTO emergency_contacts (employee_id, contact_name, relationship, phone, address) VALUES
(1, 'Sarah Kim',       'Spouse',  '+1-555-1001', '123 Home St, San Jose, CA'),
(2, 'Michael Chen',    'Brother', '+1-555-1003', '456 Family Ave, San Jose, CA'),
(3, 'Maria Lopez',     'Mother',  '+1-555-1004', '789 Parent Blvd, Dallas, TX');

-- ============================================================
-- ATTENDANCE (last 7 days)
-- ============================================================
INSERT INTO attendance (employee_id, company_id, date, check_in_time, check_out_time, status) VALUES
(1, 1, CURRENT_DATE,     NOW() - INTERVAL '8 hours',  NOW() - INTERVAL '1 hour',   'present'),
(1, 1, CURRENT_DATE - 1, NOW() - INTERVAL '32 hours', NOW() - INTERVAL '25 hours', 'present'),
(1, 1, CURRENT_DATE - 2, NULL, NULL, 'absent'),
(1, 1, CURRENT_DATE - 3, NOW() - INTERVAL '80 hours', NOW() - INTERVAL '73 hours', 'present'),
(2, 1, CURRENT_DATE,     NOW() - INTERVAL '7 hours',  NULL,                        'present'),
(2, 1, CURRENT_DATE - 1, NOW() - INTERVAL '31 hours', NOW() - INTERVAL '24 hours', 'present'),
(3, 1, CURRENT_DATE,     NOW() - INTERVAL '8 hours',  NOW() - INTERVAL '1 hour',   'present'),
(4, 2, CURRENT_DATE,     NOW() - INTERVAL '9 hours',  NOW() - INTERVAL '2 hours',  'present'),
(5, 2, CURRENT_DATE,     NULL, NULL, 'absent');

-- ============================================================
-- LEAVES
-- ============================================================
INSERT INTO leaves (employee_id, company_id, leave_type, from_date, to_date, days, reason, status) VALUES
(1, 1, 'Annual Leave',   CURRENT_DATE + 7,  CURRENT_DATE + 11, 5, 'Family vacation',  'pending'),
(2, 1, 'Sick Leave',     CURRENT_DATE - 5,  CURRENT_DATE - 4,  2, 'Fever and cold',   'approved'),
(3, 1, 'Personal Leave', CURRENT_DATE - 10, CURRENT_DATE - 10, 1, 'Personal errand',  'rejected'),
(4, 2, 'Annual Leave',   CURRENT_DATE + 14, CURRENT_DATE + 18, 5, 'Vacation',         'pending');

-- ============================================================
-- PAYROLL
-- ============================================================
INSERT INTO payroll (employee_id, company_id, month, basic, hra, allowances, bonus, deductions, tax, net_pay, status, paid_on) VALUES
(1, 1, TO_CHAR(CURRENT_DATE,'YYYY-MM'), 7917, 1583, 500,  0,    791, 420, 8789, 'paid',    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '28 days')::DATE),
(2, 1, TO_CHAR(CURRENT_DATE,'YYYY-MM'), 6250, 1250, 400,  0,    625, 310, 6965, 'paid',    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '28 days')::DATE),
(3, 1, TO_CHAR(CURRENT_DATE,'YYYY-MM'), 6667, 1333, 450,  500,  667, 350, 7933, 'pending', NULL),
(4, 2, TO_CHAR(CURRENT_DATE,'YYYY-MM'), 6000, 1200, 400,  0,    600, 300, 6700, 'paid',    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '28 days')::DATE),
(5, 2, TO_CHAR(CURRENT_DATE,'YYYY-MM'), 5417, 1083, 350,  1000, 542, 270, 7038, 'pending', NULL);

