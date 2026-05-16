import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Emergency from "./pages/Emergency";
import MapView from "./pages/MapView";
import Hospitals from "./pages/Hospitals";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}>
        <Sidebar />

        <div style={{ flex: 1, background: "#020617", minHeight: "100vh" }}>
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
