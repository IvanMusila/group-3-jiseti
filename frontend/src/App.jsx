import { BrowserRouter, Routes, Route, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import AdminReportsOverview from './features/adminReports/components/AdminReportsOverview';
import AdminReportDetail from './features/adminReports/components/AdminReportDetail';
import AdminGuard from './features/adminReports/components/AdminGuard';
import ReportList from './features/reports/components/ReportList';
import ReportForm from './features/reports/components/ReportForm';
import { useIsAdmin } from './features/adminReports/hooks/useIsAdmin';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Navbar from './components/Navbar';
import './App.css';

function AppLayout() {
  const location = useLocation();
  const isAdmin = useIsAdmin();
  const hideChromeFor = new Set(['/', '/login', '/signup']);

  if (hideChromeFor.has(location.pathname)) {
    return <Outlet />;
  }

  const baseLinkClass = ({ isActive }) => `app-link ${isActive ? 'app-link--active' : ''}`;

  return (
    <div className="app-shell">
      <header className="app-header">
        
      </header>
      <main className="app-main">
        <div className="app-main__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="app-empty">
      <h2>Page not found</h2>
      <p>Try one of the navigation links above.</p>
    </div>
  );
}

function DebugAuth() {
  const auth = useSelector(state => state.auth);
  
  useEffect(() => {
    console.log('Current Auth State:', auth);
    console.log('LocalStorage Token:', localStorage.getItem('accessToken'));
    console.log('LocalStorage User:', localStorage.getItem('user'));
  }, [auth]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <DebugAuth />
      <Navbar />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="reports" element={<ReportList />} />
          <Route path="reports/new" element={<ReportForm mode="create" />} />
          <Route path="reports/:id/edit" element={<ReportForm mode="edit" />} />
          <Route
            path="admin/reports"
            element={
              <AdminGuard>
                <AdminReportsOverview />
              </AdminGuard>
            }
          />
          <Route
            path="admin/reports/:id"
            element={
              <AdminGuard>
                <AdminReportDetail />
              </AdminGuard>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
