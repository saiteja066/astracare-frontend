import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard({ vehicles, signals }) {
  const [vCount, setVCount] = useState(0);
  const [sCount, setSCount] = useState(0);

  const navigate = useNavigate();

  // 🚪 LOGOUT FUNCTION
  const handleLogout = () => {
    // remove token
    localStorage.removeItem("token");

    // redirect + refresh auth state
    window.location.href = "/login";
  };

  useEffect(() => {
    let v = 0;
    let s = 0;

    const interval = setInterval(() => {
      if (v < vehicles.length) v++;
      if (s < signals.length) s++;

      setVCount(v);
      setSCount(s);

      if (v === vehicles.length && s === signals.length) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [vehicles, signals]);

  return (
    <div>
      <div className="title">🚦 Smart Traffic Dashboard</div>

      {/* 🔥 FIXED LOGOUT BUTTON */}
      <div
        className="logout"
        onClick={handleLogout}
        style={{ cursor: "pointer" }}
      >
        Logout
      </div>

      <div className="grid">
        <div className="card">
          <h3>Vehicles</h3>
          <h1>{vCount}</h1>
        </div>

        <div className="card">
          <h3>Signals</h3>
          <h1>{sCount}</h1>
        </div>

        <div className="card">
          <h3>Emergency</h3>
          <h1 className="pulse">Active 🚑</h1>
        </div>
      </div>
    </div>
  );
}
