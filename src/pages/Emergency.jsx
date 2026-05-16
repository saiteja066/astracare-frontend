import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Emergency({ setTarget }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmergency = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const user = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        // 🚑 ambulance spawn (near user)
        const ambulance = {
          lat: user.lat + (Math.random() - 0.5) * 0.02,
          lng: user.lng + (Math.random() - 0.5) * 0.02,
        };

        // 🏥 dummy hospital (can replace later)
        const hospital = {
          lat: user.lat + 0.02,
          lng: user.lng + 0.02,
        };

        // ✅ SET GLOBAL TARGET (for Map)
        setTarget({ ambulance });

        // ✅ STORE TRACKING DATA (IMPORTANT)
        localStorage.setItem(
          "trackingData",
          JSON.stringify({
            user,
            ambulance,
            hospital,
          }),
        );

        setLoading(false);

        // 🚀 go to tracking page
        navigate("/tracking");
      },
      (err) => {
        console.log("Geo error:", err);

        // 🔥 fallback data (if GPS fails)
        const user = { lat: 17.22, lng: 78.22 };
        const ambulance = { lat: 17.23, lng: 78.23 };
        const hospital = { lat: 17.25, lng: 78.25 };

        setTarget({ ambulance });

        localStorage.setItem(
          "trackingData",
          JSON.stringify({
            user,
            ambulance,
            hospital,
          }),
        );

        alert("Using default location");

        setLoading(false);
        navigate("/tracking");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  return (
    <div>
      <h2 className="title">🚨 Emergency Assistance</h2>

      <div
        className="card"
        style={{
          textAlign: "center",
          padding: "30px",
        }}
      >
        <p style={{ marginBottom: "20px" }}>
          Request ambulance to your current location
        </p>

        <button
          onClick={handleEmergency}
          disabled={loading}
          style={{
            padding: "15px 25px",
            borderRadius: "12px",
            border: "none",
            background: "#ef4444",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "Requesting..." : "🚑 Request Ambulance"}
        </button>
      </div>
    </div>
  );
}
