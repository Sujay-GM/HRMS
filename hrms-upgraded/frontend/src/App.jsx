import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import Login from './pages/auth/Login';
import Dashboard from './pages/common/Dashboard';
import Profile from './pages/common/Profile';
import NotFound from './pages/common/NotFound';

import Companies from './pages/superadmin/Companies';
import CreateCompany from './pages/superadmin/CreateCompany';
import Admins from './pages/superadmin/Admins';
import GlobalEmployees from './pages/superadmin/GlobalEmployees';
import Analytics from './pages/superadmin/Analytics';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';

import Employees from './pages/admin/Employees';
import CreateEmployee from './pages/admin/CreateEmployee';
import Attendance from './pages/admin/Attendance';
import Leaves from './pages/admin/Leaves';
import Payroll from './pages/admin/Payroll';
import CompanyProfile from './pages/admin/CompanyProfile';
import AdminDashboard from './pages/admin/AdminDashboard';

import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyAttendance from './pages/employee/MyAttendance';
import MyLeaves from './pages/employee/MyLeaves';
import MySalary from './pages/employee/MySalary';
import MyTimesheet from './pages/employee/MyTimesheet';
import AdminTimesheets from './pages/admin/AdminTimesheets';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: '10px',
                fontFamily: 'Inter, -apple-system, sans-serif',
                fontSize: '13.5px',
                fontWeight: 500,
              },
            }}
          />
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />

                <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                  <Route path="/super-dashboard" element={<SuperAdminDashboard />} />
                  <Route path="/companies" element={<Companies />} />
                  <Route path="/companies/create" element={<CreateCompany />} />
                  <Route path="/companies/:id/edit" element={<CreateCompany />} />
                  <Route path="/admins" element={<Admins />} />
                  <Route path="/global-employees" element={<GlobalEmployees />} />
                  <Route path="/analytics" element={<Analytics />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/employees/create" element={<CreateEmployee />} />
                  <Route path="/employees/:id/edit" element={<CreateEmployee />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/leaves" element={<Leaves />} />
                  <Route path="/payroll" element={<Payroll />} />
                  <Route path="/timesheets" element={<AdminTimesheets />} />
                  <Route path="/company-profile" element={<CompanyProfile />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
                  <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
                  <Route path="/my-attendance" element={<MyAttendance />} />
                  <Route path="/my-leaves" element={<MyLeaves />} />
                  <Route path="/my-salary" element={<MySalary />} />
                  <Route path="/my-timesheet" element={<MyTimesheet />} />
                </Route>
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
