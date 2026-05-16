import { useNavigate } from "react-router-dom";

export default function Emergency({ setTarget }) {
  const navigate = useNavigate();

  const handleEmergency = () => {
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

        // 🔥 STORE DATA
        localStorage.setItem("trackingData", JSON.stringify({ ambulance }));

        // 🔥 UPDATE STATE
        setTarget({ ambulance });

        // 🔥 GO TO MAP
        navigate("/map");
      },
      () => {
        alert("Location error");
      },
    );
  };

  return (
    <div>
      <h2>🚨 Emergency</h2>

      <button onClick={handleEmergency}>🚑 Request Ambulance</button>
    </div>
  );
}
