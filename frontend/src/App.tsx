import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { useI18n } from './i18n';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage';
import { EmployeeHistoryPage } from './pages/employee/EmployeeHistoryPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { EmployeesPage } from './pages/admin/EmployeesPage';
import { MonitoringPage } from './pages/admin/MonitoringPage';
import { RecapPage } from './pages/admin/RecapPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { SettingsPage } from './pages/admin/SettingsPage';

export default function App() {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-sm text-slate-500">{t('common.loading')}</div>
      </div>
    );
  }

  const isAdmin = user?.role === 'hr_admin';

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={isAdmin ? '/admin' : '/'} replace /> : <LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Karyawan */}
          <Route path="/" element={<EmployeeDashboardPage />} />
          <Route path="/riwayat" element={<EmployeeHistoryPage />} />
          <Route path="/ganti-password" element={<ChangePasswordPage />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute role="hr_admin"><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/karyawan" element={<ProtectedRoute role="hr_admin"><EmployeesPage /></ProtectedRoute>} />
          <Route path="/admin/monitoring" element={<ProtectedRoute role="hr_admin"><MonitoringPage /></ProtectedRoute>} />
          <Route path="/admin/rekap" element={<ProtectedRoute role="hr_admin"><RecapPage /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute role="hr_admin"><AuditLogPage /></ProtectedRoute>} />
          <Route path="/admin/pengaturan" element={<ProtectedRoute role="hr_admin"><SettingsPage /></ProtectedRoute>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAdmin ? '/admin' : '/'} replace />} />
    </Routes>
  );
}