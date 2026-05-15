import { useState } from "react";

export default function AdminPanel({ socket }) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const addSignal = () => {
    socket.emit("signal:add", {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    });
  };

  return (
    <div className="card">
      <h3>Add Signal</h3>

      <input
        placeholder="Latitude"
        onChange={(e) => setLat(e.target.value)}
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      />

      <input
        placeholder="Longitude"
        onChange={(e) => setLng(e.target.value)}
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      />

      <button onClick={addSignal} style={{ width: "100%", padding: "8px" }}>
        Add
      </button>
    </div>
  );
}
