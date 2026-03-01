import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

// Contexts & layout
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TooltipProvider } from './components/ui/Tooltip';
import { PrivateRoute } from './components/PrivateRoute';
import { Navigation } from './components/Navigation';

// Regular pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import Dashboard from './pages/Dashboard';
import { CourseDetail } from './pages/CourseDetail';
import { CreateExam } from './pages/CreateExam';
import { Analytics } from './pages/Analytics';
import { Help } from './pages/Help';
import { NotFound } from './pages/Notfound';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPasswordFromLink } from './pages/ResetPasswordFromLink';
import { ChangePassword } from './pages/ChangePassword';
import Courses from './pages/Courses';
import { QuestionBank } from './pages/QuestionBank';
import { InstructorRoutes } from './components/Routes/InstructorRoutes';
import { ExamDetail } from './pages/ExamDetail';
import { CourseAnalytics } from './pages/CourseAnalytics';
import { ExamWizardPage } from './pages/ExamWizard';

// Admin layout + pages
import AdminLayout from './components/admin/AdminLayout';
import {
  AdminHome,
  AdminLogin,
  AdminLogout,
  AdminDashboard,
  AdminHealth,
  AdminGlobalConfig,
  AdminPrivacy,
  AdminUsers,
  AdminRecentActivity,
  AdminCreateUser,
} from './pages/admin';
import { Profile } from './pages/Profile';
import { PrivacyPolicy } from './pages/admin/PrivacyPolicy';
import { ComplianceProcedures } from './pages/admin/ComplianceProcedures';

// ───────────────────────────────────────────────────────────────
// Helper component: hides the main navbar inside /admin-panel/*
// ───────────────────────────────────────────────────────────────
function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin-panel');

  return (
    <div className="min-h-screen min-w-[100vw] bg-gray-50">
      {/* show navbar only on non-admin pages */}
      {!isAdminRoute && <Navigation />}

      <Routes>
        {/* ─────── Protected instructor routes with sidebar ─────── */}
        <Route
          element={
            <PrivateRoute>
              <InstructorRoutes />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/settings" element={<Profile />} />
          <Route path="/create-exam" element={<CreateExam />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/question-bank" element={<QuestionBank />} />
          <Route path="/questionbank/:course_id" element={<QuestionBank />} />
          <Route
            path="/courses/:course_id/question-bank"
            element={<QuestionBank />}
          />
          <Route path="/exam/:id" element={<ExamDetail />} />
          <Route path="/exam-wizard" element={<ExamWizardPage />} />
          <Route path="/Help" element={<Help />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/courses/:id/analytics" element={<CourseAnalytics />} />
        </Route>

        {/* ─────── Public routes ─────── */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPasswordFromLink />} />
        <Route path="/not-found" element={<NotFound />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route
          path="/compliance-procedures"
          element={<ComplianceProcedures />}
        />

        {/* ─────── Admin-panel routes ─────── */}
        {/* public admin pages (no AdminLayout wrapper) */}
        <Route path="/admin-panel" element={<AdminHome />} />
        <Route path="/admin-panel/login" element={<AdminLogin />} />
        <Route path="/admin-panel/logout" element={<AdminLogout />} />

        {/* protected admin pages (wrapped in AdminLayout) */}
        <Route
          path="/admin-panel"
          element={
            <PrivateRoute requireAdmin={true}>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/create" element={<AdminCreateUser />} />
          <Route path="global-config" element={<AdminGlobalConfig />} />
          <Route path="health" element={<AdminHealth />} />
          <Route path="privacy" element={<AdminPrivacy />} />
          <Route path="recent-activity" element={<AdminRecentActivity />} />
        </Route>

        {/* backward compat: old /admin → /admin-panel */}
        <Route
          path="/admin/*"
          element={<Navigate to="/admin-panel" replace />}
        />

        {/* catch-all must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Root component
// ───────────────────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={100} skipDelayDuration={200}>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
