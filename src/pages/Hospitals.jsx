import { useEffect, useState } from "react";

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const base = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      const list = Array.from({ length: 6 }).map((_, i) => ({
        name: `Hospital ${i + 1}`,
        lat: base.lat + (Math.random() - 0.5) * 0.02,
        lng: base.lng + (Math.random() - 0.5) * 0.02,
      }));

      setHospitals(list);
    });
  }, []);

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2>🏥 Nearby Hospitals</h2>

      {hospitals.map((h, i) => (
        <div key={i} style={styles.card}>
          <h3>{h.name}</h3>
          <p>
            📍 {h.lat.toFixed(4)}, {h.lng.toFixed(4)}
          </p>
        </div>
      ))}
    </div>
  );
}

const styles = {
  card: {
    background: "#111827",
    padding: "15px",
    borderRadius: "15px",
    marginTop: "10px",
  },
};
