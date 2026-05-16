import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", padding: "50px", color: "white" }}>
      <h1>🚦 Dashboard</h1>

      <button onClick={() => navigate("/emergency")}>🚨 Emergency</button>

      <br />
      <br />

      <button onClick={() => navigate("/map")}>🗺️ Open Map</button>
    </div>
  );
}
