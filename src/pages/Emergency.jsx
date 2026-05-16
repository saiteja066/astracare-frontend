import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Emergency() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmergency = () => {
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const user = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        // 🔥 fake nearby hospital
        const hospital = {
          lat: user.lat + 0.02,
          lng: user.lng + 0.02,
        };

        const ambulance = {
          lat: user.lat + 0.01,
          lng: user.lng + 0.01,
        };

        const data = {
          user,
          hospital,
          ambulance,
        };

        // ✅ store data
        localStorage.setItem("trackingData", JSON.stringify(data));

        // ✅ go to tracking page
        navigate("/tracking");
      },
      () => {
        alert("Location access denied");
        setLoading(false);
      },
    );
  };

  return (
    <div>
      <h2 className="title">🚨 Emergency Assistance</h2>

      <div className="card" style={{ textAlign: "center" }}>
        <p style={{ marginBottom: "20px" }}>
          Request ambulance immediately to your location
        </p>

        <button
          onClick={handleEmergency}
          style={{
            padding: "15px 25px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
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
