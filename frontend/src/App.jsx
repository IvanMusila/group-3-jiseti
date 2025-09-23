<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ReportList from './features/reports/components/ReportList';
import ReportForm from './features/reports/components/ReportForm';
=======
import { useEffect, useState } from "react";
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HomePage from "./pages/HomePage";
import CreateReport from "./features/reports/CreateReport";
import ReportsList from "./features/reports/ReportsList";
// import RequireAuth from './features/auth/RequireAuth';

export default function App() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    fetch("https://jiseti-backend-zt8g.onrender.com/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("Error connecting to backend"));
  }, []);
>>>>>>> develop

export default function App() {
  return (
<<<<<<< HEAD
    <BrowserRouter>
      <nav style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', gap: 12 }}>
        <Link to="/reports">Reports</Link>
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
=======
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}
>>>>>>> develop
