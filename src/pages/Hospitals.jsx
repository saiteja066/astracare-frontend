import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [coords, setCoords] = useState(null);
  const [place, setPlace] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

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

  /* 🚀 FETCH */
  const fetchHospitals = async (lat, lng) => {
    setError("");

    try {
      const res = await fetch(
        "https://astracare-backend.onrender.com/hospitals",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng }),
        },
      );

      if (res.status === 503) {
        setError("⚠️ Server busy, try again");
        return;
      }

      const data = await res.json();

      const sorted = data.elements
        .map((h) => ({
          ...h,
          distance: getDistance(lat, lng, h.lat, h.lon),
        }))
        .sort((a, b) => a.distance - b.distance);

      setHospitals(sorted);
      setCoords({ lat, lng });
    } catch {
      setError("❌ Failed to load hospitals");
    }
  };

  /* 📍 AUTO LOCATION */
  useEffect(() => {
    if (loaded) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchHospitals(pos.coords.latitude, pos.coords.longitude);
        setLoaded(true);
      },
      () => setError("❌ Location denied"),
    );
  }, [loaded]);

  /* 🔍 SEARCH */
  const handleSearch = async () => {
    if (!place) return;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${place}`,
    );

    const data = await res.json();

    if (!data.length) {
      setError("❌ Location not found");
      return;
    }

    fetchHospitals(parseFloat(data[0].lat), parseFloat(data[0].lon));
  };

  /* 🗺️ MAP MOVE */
  function MapUpdater({ coords }) {
    const map = useMap();

    useEffect(() => {
      if (coords) {
        map.flyTo([coords.lat, coords.lng], 14);
      }
    }, [coords]);

    return null;
  }

  /* 🚑 ROUTE */
  const handleRoute = (h) => {
    const data = {
      user: coords,
      hospital: { lat: h.lat, lng: h.lon },
      ambulance: {
        lat: coords.lat + 0.01,
        lng: coords.lng + 0.01,
      },
    };

    localStorage.setItem("trackingData", JSON.stringify(data));
    navigate("/tracking");
  };

  return (
    <div>
      <h2 className="title">🏥 Hospitals Near You</h2>

      {/* 🔍 SEARCH */}
      <div
        className="card"
        style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
      >
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Search city..."
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            border: "none",
          }}
        />
        <button onClick={handleSearch}>🔍</button>
      </div>

      {/* ❌ ERROR */}
      {error && <div className="card">{error}</div>}

      {/* 🗺️ MAP */}
      {coords && (
        <div
          style={{
            height: "250px",
            marginBottom: "25px",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={13}
            style={{ height: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapUpdater coords={coords} />

            {hospitals.map((h, i) => (
              <Marker key={i} position={[h.lat, h.lon]}>
                <Popup>
                  <b>{h.tags?.name || "Hospital"}</b>
                  <br />
                  📏 {h.distance.toFixed(2)} km
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* 🏥 PREMIUM UI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {hospitals.map((h, i) => {
          const rating = (4 + Math.random()).toFixed(1);

          const name = h.tags?.name || "Hospital";

          const type = name.toLowerCase().includes("care")
            ? "Cardiology"
            : name.toLowerCase().includes("child")
              ? "Pediatrics"
              : name.toLowerCase().includes("women")
                ? "Gynecology"
                : "Multi-speciality";

          return (
            <div
              key={i}
              style={{
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                borderRadius: "16px",
                padding: "18px",
                color: "white",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                transition: "0.3s",
              }}
            >
              <h3>🏥 {name}</h3>

              <p style={{ color: "#94a3b8" }}>{type} Specialist</p>

              <div style={{ marginTop: "10px" }}>
                ⭐ {rating} | 120+ reviews
              </div>

              <p style={{ color: "#38bdf8", marginTop: "10px" }}>
                📍 {h.distance.toFixed(2)} km away
              </p>

              <button
                onClick={() => handleRoute(h)}
                style={{
                  marginTop: "12px",
                  width: "100%",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                🚑 Book Ambulance
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
