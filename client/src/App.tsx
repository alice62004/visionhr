import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './layouts/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import EmployeeList from './pages/Employees/EmployeeList';
import EmployeeDetail from './pages/Employees/EmployeeDetail';
import EmployeeForm from './pages/Employees/EmployeeForm';
import FaceEnrollment from './pages/Employees/FaceEnrollment';
import Departments from './pages/Departments/Departments';
import Shifts from './pages/Shifts/Shifts';
import AttendanceList from './pages/Attendance/AttendanceList';
import AttendanceDetail from './pages/Attendance/AttendanceDetail';
import AttendanceTerminal from './pages/Attendance/AttendanceTerminal';
import Leave from './pages/Leave/Leave';
import Overtime from './pages/Overtime/Overtime';
import Payroll from './pages/Payroll/Payroll';
import Reports from './pages/Reports/Reports';
import AIHR from './pages/AIHR/AIHR';
import AuditLog from './pages/AuditLog/AuditLog';
import Settings from './pages/Settings/Settings';
import UserList from './pages/Users/UserList';
import HomePage from './pages/Home/HomePage';
import MyProfile from './pages/MyProfile/MyProfile';
import WorkHistory from './pages/WorkHistory/WorkHistory';
import MySchedule from './pages/MySchedule/MySchedule';
import ShiftScheduling from './pages/Shifts/ShiftScheduling';
import Contracts from './pages/Contracts/Contracts';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Cá nhân nhân viên */}
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/my-schedule" element={<MySchedule />} />
          <Route path="/work-history" element={<WorkHistory />} />

          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['admin']}><UserList /></ProtectedRoute>
          } />

          <Route path="/employees" element={
            <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}><EmployeeList /></ProtectedRoute>
          } />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/employees/new" element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}><EmployeeForm /></ProtectedRoute>
          } />
          <Route path="/employees/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}><EmployeeDetail /></ProtectedRoute>
          } />
          <Route path="/employees/:id/edit" element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}><EmployeeForm /></ProtectedRoute>
          } />
          <Route path="/employees/face-enrollment" element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}><FaceEnrollment /></ProtectedRoute>
          } />
          <Route path="/employees/:id/face-enrollment" element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}><FaceEnrollment /></ProtectedRoute>
          } />

          <Route path="/departments" element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}><Departments /></ProtectedRoute>
          } />
          <Route path="/shifts" element={
            <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}><Shifts /></ProtectedRoute>
          } />
          <Route path="/shift-scheduling" element={
            <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}><ShiftScheduling /></ProtectedRoute>
          } />

          <Route path="/attendance" element={<AttendanceList />} />
          <Route path="/attendance/:id" element={<AttendanceDetail />} />
          <Route path="/attendance/terminal" element={<AttendanceTerminal />} />

          <Route path="/leave" element={<Leave />} />
          <Route path="/overtime" element={<Overtime />} />

          <Route path="/payroll" element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}><Payroll /></ProtectedRoute>
          } />

          <Route path="/ai-agent" element={<AIHR />} />

          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}><Reports /></ProtectedRoute>
          } />
          <Route path="/audit-log" element={
            <ProtectedRoute allowedRoles={['admin']}><AuditLog /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
