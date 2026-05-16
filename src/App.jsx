import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import Analytics from "./pages/Analytics";
import Hospitals from "./pages/Hospitals";
import Emergency from "./pages/Emergency";
import Tracking from "./pages/Tracking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Sidebar from "./Sidebar";

function App() {
  const [target, setTarget] = useState(null);

  const signals = [
    { id: 1, lat: 17.22, lng: 78.22 },
    { id: 2, lat: 17.26, lng: 78.27 },
  ];

  function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" replace />;
    return children;
  }

  function PublicRoute({ children }) {
    const token = localStorage.getItem("token");
    if (token) return <Navigate to="/" replace />;
    return children;
  }

  return (
    <Router>
      <div style={{ display: "flex", height: "100vh" }}>
        {localStorage.getItem("token") && <Sidebar />}

        <div style={{ flex: 1, padding: "20px" }}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard signals={signals} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <MapPage signals={signals} target={target} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hospitals"
              element={
                <ProtectedRoute>
                  <Hospitals />
                </ProtectedRoute>
              }
            />

            <Route
              path="/emergency"
              element={
                <ProtectedRoute>
                  <Emergency setTarget={setTarget} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tracking"
              element={
                <ProtectedRoute>
                  <Tracking />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
