import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ReportList from './features/reports/components/ReportList';
import ReportForm from './features/reports/components/ReportForm';

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <Link to="/reports">Reports</Link>{' '}
        <Link to="/reports/new">New Report</Link>
      </nav>
      <Routes>
        <Route path="/reports" element={<ReportList />} />
        <Route path="/reports/new" element={<ReportForm mode="create" />} />
        <Route path="/reports/:id/edit" element={<ReportForm mode="edit" />} />
        <Route path="*" element={<div style={{ padding: 16 }}>Go to <Link to="/reports">Reports</Link></div>} />
      </Routes>
    </BrowserRouter>
  );
}