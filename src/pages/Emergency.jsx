import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Emergency() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmergency = () => {
    setLoading(true);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const user = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      try {
        const res = await fetch(
          "https://astracare-backend.onrender.com/api/hospitals",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
          },
        );

        const data = await res.json();

        const hospital = data.hospitals[0];

        const trackingData = {
          user,
          hospital,
          ambulance: user,
        };

        localStorage.setItem("trackingData", JSON.stringify(trackingData));

        navigate("/map");
      } catch (err) {
        console.log(err);
      }

      setLoading(false);
    });
  };

  return (
    <div>
      <h2>🚨 Emergency</h2>
      <button onClick={handleEmergency}>
        {loading ? "Loading..." : "Request Ambulance"}
      </button>
    </div>
  );
}
