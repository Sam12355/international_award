import { Routes, Route, Navigate } from 'react-router-dom';
import GuestRoute from './components/guards/GuestRoute';
import ProtectedRoute from './components/guards/ProtectedRoute';
import RoleGuard from './components/guards/RoleGuard';
import GuestLayout from './components/layout/GuestLayout';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import ArticlesPage from './pages/articles/ArticlesPage';
import CreateArticlePage from './pages/articles/CreateArticlePage';
import ArticleDetailPage from './pages/articles/ArticleDetailPage';
import EditArticlePage from './pages/articles/EditArticlePage';

import ReviewDashboardPage from './pages/reviews/ReviewDashboardPage';
import ReviewArticlePage from './pages/reviews/ReviewArticlePage';

import PublishPage from './pages/publish/PublishPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Guest routes — redirect to /articles if already logged in */}
      <Route element={<GuestRoute />}>
        <Route element={<GuestLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      {/* Protected routes — redirect to /login if not authenticated */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Articles — available to all authenticated users */}
          <Route path="/" element={<Navigate to="/articles" replace />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/create" element={<CreateArticlePage />} />
          <Route path="/articles/:id" element={<ArticleDetailPage />} />
          <Route path="/articles/:id/edit" element={<EditArticlePage />} />

          {/* Reviews — REVIEWER and ADMIN only */}
          <Route element={<RoleGuard allowedRoles={['REVIEWER', 'ADMIN']} />}>
            <Route path="/reviews" element={<ReviewDashboardPage />} />
            <Route path="/reviews/:id" element={<ReviewArticlePage />} />
          </Route>

          {/* Publish — ADMIN only */}
          <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
            <Route path="/publish" element={<PublishPage />} />
          </Route>

          {/* Profile */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
