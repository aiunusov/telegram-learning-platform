import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingPage } from './pages/LoadingPage';
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

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/create" element={<CreateProjectPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/homework/submit" element={<HomeworkSubmitPage />} />
          <Route path="/homework/review" element={<HomeworkReviewPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
