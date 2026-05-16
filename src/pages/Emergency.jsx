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

        const ambulance = {
          lat: user.lat + 0.01,
          lng: user.lng + 0.01,
        };

        const hospital = {
          lat: user.lat + 0.02,
          lng: user.lng + 0.02,
        };

        // ✅ GLOBAL STATE
        setTarget({ ambulance });

        // ✅ STORE FOR TRACKING
        localStorage.setItem(
          "trackingData",
          JSON.stringify({
            user,
            ambulance,
            hospital,
          }),
        );

        setLoading(false);
        navigate("/tracking");
      },
      () => {
        alert("Location error");
        setLoading(false);
      },
    );
  };

  return (
    <div>
      <h2>🚨 Emergency</h2>
      <button onClick={handleEmergency}>
        {loading ? "..." : "🚑 Request Ambulance"}
      </button>
    </div>
  );
}
