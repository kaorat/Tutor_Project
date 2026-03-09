import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import useAuthStore from './stores/useAuthStore';
import useThemeStore from './stores/useThemeStore';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Classes from './pages/Classes';
import ClassDetail from './pages/ClassDetail';
import ClassOverview from './pages/ClassOverview';
import ClassAttendance from './pages/ClassAttendance';
import ClassStudents from './pages/ClassStudents';
import StudentDetail from './pages/StudentDetail';
import Schedules from './pages/Schedules';
import Attendance from './pages/Attendance';
import Grades from './pages/Grades';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import TaskOrchestrator from './pages/TaskOrchestrator';
import FeedbackForm from './pages/FeedbackForm';

import AdminTutors from './pages/AdminTutors';
import TutorDetail from './pages/TutorDetail';
import NotFound from './pages/NotFound';

// F2.5: Protected route with RBAC, useSearchParams
function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuthStore();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="glass-card p-10 text-center">
        <div className="text-4xl mb-4 animate-pulse">⚛</div>
        <p className="text-[var(--text-secondary)]">Loading...</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" />;
  // RBAC check
  if (allowedRoles && !allowedRoles.includes(user?.role) && user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuthStore();
  if (loading) return null;
  if (!isAuthenticated) return children;
  return <Navigate to={user?.role === 'admin' ? '/admin/tutors' : '/dashboard'} />;
}

function DefaultRedirect() {
  const user = useAuthStore(s => s.user);
  return <Navigate to={user?.role === 'admin' ? '/admin/tutors' : '/dashboard'} />;
}

function AppContent() {
  const initTheme = useThemeStore(s => s.initTheme);
  const fetchUser = useAuthStore(s => s.fetchUser);
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    initTheme();
    if (token) fetchUser();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<DefaultRedirect />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          {/* F2.2: Dynamic /students/:id route */}
          <Route path="students/:id" element={<StudentDetail />} />
          {/* F2.4: Nested /classes/:id routes with Outlet */}
          <Route path="classes" element={<Classes />} />
          <Route path="classes/:id" element={<ClassDetail />}>
            <Route index element={<ClassOverview />} />
            <Route path="attendance" element={<ClassAttendance />} />
            <Route path="students" element={<ClassStudents />} />
          </Route>
          <Route path="schedules" element={<Schedules />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="grades" element={<Grades />} />
          <Route path="reports" element={<PrivateRoute allowedRoles={['tutor', 'admin']}><Reports /></PrivateRoute>} />
          <Route path="profile" element={<Profile />} />
          <Route path="tasks" element={<TaskOrchestrator />} />
          <Route path="feedback" element={<FeedbackForm />} />
          <Route path="admin/tutors" element={<PrivateRoute allowedRoles={['admin']}><AdminTutors /></PrivateRoute>} />
          <Route path="admin/tutors/:id" element={<PrivateRoute allowedRoles={['admin']}><TutorDetail /></PrivateRoute>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(20px)',
          },
        }}
      />
    </BrowserRouter>
  );
}

function App() {
  return (
    // F2.1: ThemeProvider wraps entire app — Context API for dark/light mode
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
