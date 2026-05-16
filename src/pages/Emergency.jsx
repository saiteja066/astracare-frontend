import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Emergency({ setTarget }) {
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

        // 🚑 SET AMBULANCE LOCATION (IMPORTANT)
        setTarget({
          ambulance: {
            lat: user.lat + 0.01,
            lng: user.lng + 0.01,
          },
        });

        setLoading(false);

        // 🚀 GO TO MAP PAGE
        navigate("/map");
      },
      (err) => {
        console.log(err);
        alert("❌ Location access denied");
        setLoading(false);
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
        <p style={{ marginBottom: "20px", fontSize: "16px" }}>
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
