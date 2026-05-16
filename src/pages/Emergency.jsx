import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Emergency() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmergency = () => {
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const user = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        try {
          /* 🔥 CALL BACKEND */
          const res = await fetch(
            "http://localhost:5000/api/hospitals/emergency",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(user),
            },
          );

          const data = await res.json();

          if (!data.hospitals || data.hospitals.length === 0) {
            alert("No hospitals found nearby");
            setLoading(false);
            return;
          }

          /* ✅ PICK NEAREST */
          const hospital = data.hospitals[0];

          /* 🚑 AMBULANCE STARTS FROM USER */
          const ambulance = {
            lat: user.lat,
            lng: user.lng,
          };

          const trackingData = {
            user,
            hospital,
            ambulance,
          };

          localStorage.setItem("trackingData", JSON.stringify(trackingData));

          navigate("/map");
        } catch (err) {
          console.log(err);
          alert("Error fetching hospital");
        }

        setLoading(false);
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
          disabled={loading}
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
