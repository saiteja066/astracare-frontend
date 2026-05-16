import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Emergency() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /* 📏 DISTANCE */
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /* 🚑 EMERGENCY */
  const handleEmergency = () => {
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const user = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        try {
          // 🔥 fetch hospitals from backend
          const res = await fetch(
            "https://astracare-backend.onrender.com/hospitals",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(user),
            },
          );

          const data = await res.json();

          if (!data.elements?.length) {
            alert("No hospitals found");
            setLoading(false);
            return;
          }

          // 🔥 find nearest hospital
          const nearest = data.elements
            .map((h) => ({
              ...h,
              distance: getDistance(user.lat, user.lng, h.lat, h.lon),
            }))
            .sort((a, b) => a.distance - b.distance)[0];

          const hospital = {
            lat: nearest.lat,
            lng: nearest.lon,
          };

          const ambulance = {
            lat: user.lat + 0.01,
            lng: user.lng + 0.01,
          };

          const trackingData = {
            user,
            hospital,
            ambulance,
          };

          // ✅ store
          localStorage.setItem("trackingData", JSON.stringify(trackingData));

          // ✅ navigate
          navigate("/tracking");
        } catch (err) {
          console.log(err);
          alert("Emergency request failed");
          setLoading(false);
        }
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
