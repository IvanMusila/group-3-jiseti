import { useEffect, useState } from "react";
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HomePage from "./pages/HomePage";
// import RequireAuth from './features/auth/RequireAuth';

function App() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    fetch("https://jiseti-backend-zt8g.onrender.com/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("Error connecting to backend"));
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

export default App;
