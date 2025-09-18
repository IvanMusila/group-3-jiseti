import React from "react";
import Signup from "./features/auth/Signup";
import Login from "./features/auth/Login";
import CreateReport from "./features/reports/CreateReport";
import ReportsList from "./features/reports/ReportsList";

export default function App(){
  return (
    <div style={{padding:20}}>
      <h1>Jiseti (demo)</h1>
      <div style={{display:"flex", gap:20}}>
        <div style={{flex:1}}>
          <Signup />
          <Login />
          <CreateReport />
        </div>
        <div style={{flex:2}}>
          <ReportsList />
        </div>
      </div>
    </div>
  );
}
