HRMS Enhanced — v2.0
Full-stack Human Resource Management System (Node.js + Express + PostgreSQL + React)

What's New in v2.0
1. Employee Full-Page Form (/employees/create, /employees/:id/edit)
Replaced modal with dedicated full-page form
Responsive 2-column layout with 5 sections:
Basic Info (name, email, password, phone, gender, DOB)
Job Details (department, position, employment type, joining date, work location)
Salary Details (amount, type: monthly/annual, currency)
Emergency Contact (name, relationship, phone, alt-phone, address)
Inline validation with per-field error messages
2. Company Full-Page Form (/companies/create, /companies/:id/edit)
Replaced modal with dedicated full-page form
4 sections: Company Info, Address, Business Details, Admin Setup
Auto-creates admin user when admin credentials are provided
3. Employee Attendance (Check-In / Check-Out)
Employee Dashboard: live clock, check-in/check-out buttons, status display
POST /api/attendance/check-in — prevents duplicate check-ins
POST /api/attendance/check-out — prevents check-out without check-in
GET /api/attendance/me — employee's own history + today's record
Working hours auto-calculated
My Attendance page: monthly filter, stats cards, full history table
4. Emergency Contact Model
New emergency_contacts table linked to employees (one-to-one)
Shown in employee view modal (admin side)
5. Schema Enhancements
employees: added employment_type, work_location, salary_type, currency
companies: added address_line, city, state, country, zip_code, company_size, registration_number
attendance: replaced check_in TIME / check_out TIME with check_in_time TIMESTAMP / check_out_time TIMESTAMP
Credentials
Role	Email	Password
Super Admin	superadmin@hrms.com	admin123
Admin	admin@techcorp.com	admin123
Employee	david@techcorp.com	emp123
Setup
Backend
cd backend
npm install
# Configure .env (copy from .env.example)
# Run schema.sql in your PostgreSQL database
npm start
Frontend
cd frontend
npm install
npm run dev
.env (backend)
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hrms
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173
API Reference — New / Changed Endpoints
Attendance
Method	Path	Auth	Description
POST	/api/attendance/check-in	Employee	Check in for today
POST	/api/attendance/check-out	Employee	Check out for today
GET	/api/attendance/me	Employee	Own attendance + today record
GET	/api/attendance	Admin	Company attendance list
GET	/api/attendance/today	Admin	Today's attendance
GET	/api/attendance/report	Admin	Monthly report
Employees
Method	Path	Auth	Description
POST	/api/employees	Admin	Create employee + emergency contact
PUT	/api/employees/:id	Admin	Update employee + emergency contact
GET	/api/employees/:id	Admin	Get employee with emergency contact
Companies
Method	Path	Auth	Description
POST	/api/companies	Super Admin	Create company + optional admin user
Folder Structure
hrms-enhanced/
├── backend/
│   └── src/
│       ├── config/db.js
│       ├── controllers/
│       │   ├── attendanceController.js  ← updated
│       │   ├── companyController.js     ← updated
│       │   ├── employeeController.js    ← updated
│       │   └── ...
│       ├── db/schema.sql                ← updated
│       ├── middleware/auth.js
│       └── routes/
│           ├── attendance.js            ← updated
│           └── ...
└── frontend/
    └── src/
        ├── pages/
        │   ├── admin/
        │   │   ├── CreateEmployee.jsx   ← NEW
        │   │   └── Employees.jsx        ← updated
        │   ├── employee/
        │   │   ├── EmployeeDashboard.jsx ← updated (check-in/out)
        │   │   └── MyAttendance.jsx     ← updated (check-in/out)
        │   └── superadmin/
        │       ├── CreateCompany.jsx    ← NEW
        │       └── Companies.jsx        ← updated
        └── services/
            └── attendanceService.js    ← updated
