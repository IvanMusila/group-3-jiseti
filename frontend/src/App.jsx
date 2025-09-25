import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ReportList from './features/reports/components/ReportList';
import ReportForm from './features/reports/components/ReportForm';
import AdminReportsOverview from './features/adminReports/components/AdminReportsOverview';
import AdminReportDetail from './features/adminReports/components/AdminReportDetail';
import AdminGuard from './features/adminReports/components/AdminGuard';
import { useIsAdmin } from './features/adminReports/hooks/useIsAdmin';
import './App.css';

export default function App() {
  const isAdmin = useIsAdmin();

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <span className="app-logo">Jiseti</span>
          <nav className="app-nav">
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `app-link ${isActive ? 'app-link--active' : ''}`
              }
            >
              Reports
            </NavLink>
            <NavLink
              to="/reports/new"
              className={({ isActive }) =>
                `app-link app-link--primary ${isActive ? 'app-link--active' : ''}`
              }
            >
              New Report
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin/reports"
                className={({ isActive }) =>
                  `app-link ${isActive ? 'app-link--active' : ''}`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>
        </header>
        <main className="app-main">
          <div className="app-main__content">
            <Routes>
              <Route path="/reports" element={<ReportList />} />
              <Route path="/reports/new" element={<ReportForm mode="create" />} />
              <Route path="/reports/:id/edit" element={<ReportForm mode="edit" />} />
              <Route
                path="/admin/reports"
                element={
                  <AdminGuard>
                    <AdminReportsOverview />
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/reports/:id"
                element={
                  <AdminGuard>
                    <AdminReportDetail />
                  </AdminGuard>
                }
              />
              <Route
                path="*"
                element={
                  <div className="app-empty">
                    Go to <NavLink to="/reports">Reports</NavLink>
                  </div>
                }
              />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
