import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/animations.css'; // Import custom animations
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Internships from './pages/Internships';
import About from './pages/About';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PasswordProtectedRoute from './components/auth/PasswordProtectedRoute';
import InternDashboard from './pages/dashboards/intern';
import InternDashboardHome from './pages/dashboards/intern/InternDashboardHome';
import AssignedProjects from './pages/dashboards/intern/AssignedProjects';
import AvailableProjects from './pages/dashboards/intern/AvailableProjects';
import Reports from './pages/dashboards/intern/Reports';
import Assignments from './pages/dashboards/intern/Assignments';
import AttendancePage from './pages/dashboards/intern/AttendancePage';
import GuideDashboard from './pages/dashboards/guide';
import DeveloperWelcome from './pages/dashboards/guide/DeveloperWelcome';
import DeveloperAssignedProjects from './pages/dashboards/guide/DeveloperAssignedProjects';
import DeveloperAvailableProjects from './pages/dashboards/guide/DeveloperAvailableProjects';
import DeveloperProjects from './pages/dashboards/guide/DeveloperProjects';
import DeveloperAssignments from './pages/dashboards/guide/DeveloperAssignments';
import DeveloperReports from './pages/dashboards/guide/DeveloperReports';
import DeveloperInterns from './pages/dashboards/guide/DeveloperInterns';
import OrgAdminDashboard from './pages/dashboards/orgadmin';
import OrgAdminWelcome from './pages/dashboards/orgadmin/OrgAdminWelcome';
import ManageInternships from './pages/dashboards/orgadmin/ManageInternships';
import ManageApplications from './pages/dashboards/orgadmin/ManageApplications';
import ManageProjects from './pages/dashboards/orgadmin/ManageProjects';
import ManageProjectAssignments from './pages/dashboards/orgadmin/ManageProjectAssignments';
import ManageBlacklist from './pages/dashboards/orgadmin/ManageBlacklist';
import CompanyStats from './pages/dashboards/orgadmin/CompanyStats';

import SysAdminDashboard from './pages/dashboards/sysadmin';
import SysAdminWelcome from './pages/dashboards/sysadmin/SysAdminWelcome';
import SysAdminManageInternships from './pages/dashboards/sysadmin/SysAdminManageInternships';
import SysAdminStats from './pages/dashboards/sysadmin/SysAdminStats';

import CandidateDashboard from './pages/dashboards/candidate';
import MyApplications from './pages/dashboards/candidate/MyApplications';

import VerifyEmail from './pages/auth/VerifyEmail';
import PendingApproval from './pages/auth/PendingApproval';
import ForgotPassword from './pages/auth/ForgotPassword';
import ChangePassword from './pages/auth/ChangePassword';
import PendingUsers from './pages/admin/PendingUsers';
import Footer from './components/Footer';
import { Link } from 'react-router-dom';

import ChatPage from './pages/dashboards/shared/ChatPage';
import { io } from 'socket.io-client';
import DeveloperAttendance from './pages/dashboards/guide/DeveloperAttendance';
import OrgAdminAttendance from './pages/dashboards/orgadmin/OrgAdminAttendance';
import ProfilePage from './pages/ProfilePage';


function App() {
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    document.title = 'TallyIntern';
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    socketRef.current = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000', {
      auth: { token }
    });
    const socket = socketRef.current;
    socket.on('receiveMessage', () => {
      if (!window.location.pathname.startsWith('/dashboard/chat')) {
        setUnreadCount(count => count + 1);
      }
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (window.location.pathname.startsWith('/dashboard/chat')) {
      setUnreadCount(0);
    }
  }, [window.location.pathname]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar unreadCount={unreadCount} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/about" element={<About />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route
              path="/dashboard/chat/:projectAssignmentId"
              element={
                <ProtectedRoute allowedRoles={['intern', 'guide', 'orgadmin', 'sysadmin']}>
                  <ChatPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard/intern"
              element={
                <ProtectedRoute allowedRoles={['intern']}>
                  <InternDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<InternDashboardHome />} />
              <Route path="assigned-projects" element={<AssignedProjects />} />
              <Route path="available-projects" element={<AvailableProjects />} />
              <Route path="reports" element={<Reports />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="attendance" element={<AttendancePage />} />
            </Route>

            <Route
              path="/dashboard/guide"
              element={
                <ProtectedRoute allowedRoles={['guide', 'developer']}>
                  <GuideDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<DeveloperWelcome />} />
              <Route path="assigned-projects" element={<DeveloperAssignedProjects />} />
              <Route path="assignments" element={<DeveloperAssignments />} />
              <Route path="reports" element={<DeveloperReports />} />
              <Route path="interns" element={<DeveloperInterns />} />
              <Route path="projects" element={<DeveloperProjects />} />
              <Route path="available-projects" element={<DeveloperAvailableProjects />} />
              <Route path="attendance" element={<DeveloperAttendance />} />
            </Route>

            <Route
              path="/dashboard/orgadmin"
              element={
                <ProtectedRoute allowedRoles={['orgadmin']}>
                  <OrgAdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<OrgAdminWelcome />} />
              <Route path="pending-users" element={<PendingUsers />} />
              <Route path="internships" element={<ManageInternships />} />
              <Route path="applications" element={<ManageApplications />} />
              <Route path="projects" element={<ManageProjects />} />
              <Route path="project-assignments" element={<ManageProjectAssignments />} />
              <Route path="blacklist" element={<ManageBlacklist />} />
              <Route path="company-stats" element={<CompanyStats />} />
              <Route path="attendance" element={<OrgAdminAttendance />} />
            </Route>
            
            <Route
              path="/dashboard/sysadmin"
              element={
                <ProtectedRoute allowedRoles={['sysadmin', 'admin']}>
                  <SysAdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<SysAdminWelcome />} />
              <Route path="pending-approvals" element={<PendingUsers />} />
              <Route path="manage-internships" element={<SysAdminManageInternships />} />
              <Route path="statistics" element={<SysAdminStats />} />
            </Route>

            <Route
              path="/dashboard/candidate"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <CandidateDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<MyApplications />} />
              <Route path="my-applications" element={<MyApplications />} />
            </Route>

            <Route
              path="/change-password"
              element={
                <PasswordProtectedRoute>
                  <ChangePassword />
                </PasswordProtectedRoute>
              }
            />
            
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            <Route 
              path="/unauthorized" 
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Unauthorized Access</h1>
                    <p className="text-gray-600 mb-8">You do not have permission to access this page.</p>
                    <Link to="/" className="text-blue-600 hover:text-blue-800">
                      Return to Home
                    </Link>
                  </div>
                </div>
              } 
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </Router>
  );
}

export default App;
