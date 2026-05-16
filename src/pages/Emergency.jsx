import { useNavigate } from "react-router-dom";

export default function Emergency() {
  const navigate = useNavigate();

  const handleEmergency = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const user = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      const hospital = {
        lat: user.lat + 0.02,
        lng: user.lng + 0.02,
      };

      localStorage.setItem("trackingData", JSON.stringify({ user, hospital }));

      navigate("/map");
    });
  };

  return (
    <div style={{ textAlign: "center", padding: "50px", color: "white" }}>
      <h2>🚨 Emergency</h2>
      <button onClick={handleEmergency}>🚑 Request Ambulance</button>
    </div>
  );
}
