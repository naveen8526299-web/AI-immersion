import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppStateProvider, useAppState } from './contexts/AppStateContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppShell } from './layouts/AppShell';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FeatureControlFlags, UserRole } from './types';

const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const ArmoryPage = lazy(() => import('./pages/ArmoryPage').then((m) => ({ default: m.ArmoryPage })));
const AttendancePage = lazy(() => import('./pages/AttendancePage').then((m) => ({ default: m.AttendancePage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const FacultyPage = lazy(() => import('./pages/FacultyPage').then((m) => ({ default: m.FacultyPage })));
const HeroesPage = lazy(() => import('./pages/HeroesPage').then((m) => ({ default: m.HeroesPage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage').then((m) => ({ default: m.InsightsPage })));
const NotificationsPage = lazy(() =>
  import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);
const ODPage = lazy(() => import('./pages/ODPage').then((m) => ({ default: m.ODPage })));
const PredictorPage = lazy(() => import('./pages/PredictorPage').then((m) => ({ default: m.PredictorPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const RecoveryPage = lazy(() => import('./pages/RecoveryPage').then((m) => ({ default: m.RecoveryPage })));
const SemesterPage = lazy(() => import('./pages/SemesterPage').then((m) => ({ default: m.SemesterPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage').then((m) => ({ default: m.SimulatorPage })));
const SquadPage = lazy(() => import('./pages/SquadPage').then((m) => ({ default: m.SquadPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then((m) => ({ default: m.TasksPage })));

const ProtectedRoute: React.FC<{
  allowedRoles?: UserRole[];
  requiredFeature?: keyof FeatureControlFlags;
  children: React.ReactElement;
}> = ({ allowedRoles, requiredFeature, children }) => {
  const { user, loading } = useAuth();
  const { featureControls } = useAppState();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm">Loading AttendanceGuard...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="glass-card rounded-2xl p-6 max-w-lg mx-auto mt-10 text-center space-y-3">
        <h2 className="font-display text-xl font-bold text-rose-400">Access Restricted</h2>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Your role ({user.role}) does not have permission to access this route.
        </p>
      </div>
    );
  }
  if (user.role === 'STUDENT' && requiredFeature && !featureControls[requiredFeature]) {
    return (
      <div className="glass-card rounded-2xl p-6 max-w-lg mx-auto mt-10 text-center space-y-3">
        <h2 className="font-display text-xl font-bold text-amber-400">Disabled by College Administration</h2>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          This portal module is currently turned off in Admin Command Feature Access Control.
        </p>
      </div>
    );
  }
  return children;
};

const PageLoader = () => (
  <div className="py-20 text-center text-xs font-semibold text-slate-400 animate-pulse">Loading module...</div>
);

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppStateProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route
                    path="/attendance"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <AttendancePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/simulator"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']} requiredFeature="allowBunkSimulator">
                        <SimulatorPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/predictor"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <PredictorPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/recovery"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <RecoveryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/heroes"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']} requiredFeature="allowHeroGamification">
                        <HeroesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/armory"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']} requiredFeature="allowHeroGamification">
                        <ArmoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/squad"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']} requiredFeature="allowSquadConnect">
                        <SquadPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tasks"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <TasksPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/semester" element={<SemesterPage />} />
                  <Route
                    path="/od"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']} requiredFeature="allowODRequests">
                        <ODPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/insights"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <InsightsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route
                    path="/faculty"
                    element={
                      <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                        <FacultyPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AppStateProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
