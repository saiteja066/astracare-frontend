import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Pages
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
  /* 🚑 GLOBAL TARGET */
  const [target, setTarget] = useState({
    ambulance: { lat: 17.21, lng: 78.21 },
  });

  /* 🚗 GLOBAL VEHICLES (fallback/demo) */
  const [vehicles] = useState([
    { lat: 17.22, lng: 78.22, speed: 20 },
    { lat: 17.24, lng: 78.23, speed: 15 },
  ]);

  /* 🚦 SIGNALS */
  const signals = [
    { id: 1, lat: 17.22, lng: 78.22 },
    { id: 2, lat: 17.26, lng: 78.27 },
  ];

  /* 🔐 PROTECTED ROUTE */
  function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" replace />;
    return children;
  }

  /* 🔓 PUBLIC ROUTE */
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
            {/* 🔓 LOGIN */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* 🔓 REGISTER */}
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* 🔐 DASHBOARD */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard vehicles={vehicles} signals={signals} />
                </ProtectedRoute>
              }
            />

            {/* 🔐 MAP */}
            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <MapPage signals={signals} target={target} />
                </ProtectedRoute>
              }
            />

            {/* 🔐 ANALYTICS */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics vehicles={vehicles} />
                </ProtectedRoute>
              }
            />

            {/* 🔐 HOSPITALS */}
            <Route
              path="/hospitals"
              element={
                <ProtectedRoute>
                  <Hospitals />
                </ProtectedRoute>
              }
            />

            {/* 🚑 EMERGENCY */}
            <Route
              path="/emergency"
              element={
                <ProtectedRoute>
                  <Emergency setTarget={setTarget} />
                </ProtectedRoute>
              }
            />

            {/* 🚑 TRACKING */}
            <Route
              path="/tracking"
              element={
                <ProtectedRoute>
                  <Tracking />
                </ProtectedRoute>
              }
            />

            {/* 🔄 FALLBACK */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
