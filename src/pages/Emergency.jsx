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

        setTarget({
          ambulance: {
            lat: user.lat + 0.01,
            lng: user.lng + 0.01,
          },
        });

        setLoading(false);
        navigate("/map");
      },
      () => {
        alert("Location denied");
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
