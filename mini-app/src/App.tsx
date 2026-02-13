import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingPage } from './pages/LoadingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ProfilePage } from './pages/ProfilePage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminStudentsPage } from './pages/AdminStudentsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { TestsPage } from './pages/TestsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { HomeworkSubmitPage } from './pages/HomeworkSubmitPage';
import { HomeworkReviewPage } from './pages/HomeworkReviewPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoadingPage />} />

        {/* Onboarding - outside AppShell (no bottom nav) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Main app with bottom navigation */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* Student routes */}
          <Route path="/dashboard" element={<StudentDashboardPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/homework/submit" element={<HomeworkSubmitPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/students" element={<AdminStudentsPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/homework/review" element={<HomeworkReviewPage />} />

          {/* Shared routes */}
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/create" element={<CreateProjectPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
