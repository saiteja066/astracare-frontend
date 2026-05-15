import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="sidebar">
      {/* 🔥 CENTER WRAPPER */}
      <div className="logo-box">
        <img src="./icononly.png" className="logo" />
      </div>

      <h2>AstraCare</h2>

      <Link to="/">🏠 Dashboard</Link>
      <Link to="/map">🗺️ Map</Link>
      <Link to="/analytics">📊 Analytics</Link>
      <Link to="/hospitals">🏥 Hospitals</Link>
      <Link to="/emergency">🚑 Emergency</Link>
      <Link to="/tracking">📍 Tracking</Link>
    </div>
  );
}
