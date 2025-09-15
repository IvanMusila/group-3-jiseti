import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    // ⚠️ Replace this with your actual backend URL from Render
    fetch("https://<your-backend-service>.onrender.com/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch((err) => setStatus("Error connecting to backend"));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Jiseti Frontend</h1>
      <p>Backend Status: {status}</p>
    </div>
  );
}

export default App;
