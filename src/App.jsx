import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Emergency from "./pages/Emergency.jsx";
import MapView from "./pages/MapView.jsx";
import Hospitals from "./pages/Hospitals.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <div style={styles.layout}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div style={styles.content}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/hospitals" element={<Hospitals />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

const styles = {
  layout: {
    display: "flex",
  },
  content: {
    flex: 1,
    background: "#020617",
    minHeight: "100vh",
  },
};
