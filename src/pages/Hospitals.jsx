import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [coords, setCoords] = useState(null);
  const [place, setPlace] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      const res = await fetch(
        "https://astracare-backend.onrender.com/api/hospitals/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lat,
            lng,
            query: "",
          }),
        },
      );

      const data = await res.json();

      const sorted = (data.hospitals || [])
        .map((h) => ({
          ...h,
          distance: getDistance(lat, lng, h.lat, h.lng),
        }))
        .sort((a, b) => a.distance - b.distance);

      setHospitals(sorted);
      setCoords({ lat, lng });
    } catch (err) {
      console.log(err);
      setError("❌ Failed to load hospitals");
    }

    setLoading(false);
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

  /* 🗺️ MAP UPDATE */
  function MapUpdater({ coords }) {
    const map = useMap();

    useEffect(() => {
      if (coords) {
        map.flyTo([coords.lat, coords.lng], 14);
      }
    }, [coords]);

    return null;
  }

  return (
    <div>
      <h2 className="title">🏥 Hospitals Near You</h2>

      {/* 🔍 SEARCH */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Search city..."
          style={{ flex: 1, padding: "10px" }}
        />
        <button onClick={handleSearch}>🔍</button>
      </div>

      {/* 🔄 LOADING */}
      {loading && <p>🔄 Loading hospitals...</p>}

      {/* ❌ ERROR */}
      {error && <p>{error}</p>}

      {/* ❌ NO DATA */}
      {!loading && hospitals.length === 0 && <p>❌ No hospitals found</p>}

      {/* 🗺️ MAP */}
      {coords && (
        <div style={{ height: "250px", marginBottom: "20px" }}>
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={13}
            style={{ height: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapUpdater coords={coords} />

            {hospitals.map((h, i) => (
              <Marker key={i} position={[h.lat, h.lng]}>
                <Popup>
                  <b>{h.name}</b>
                  <br />
                  📏 {h.distance.toFixed(2)} km
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* 🏥 CARDS (ZOMATO STYLE) */}
      {hospitals.map((h, i) => {
        const rating = (4 + Math.random()).toFixed(1);

        return (
          <div
            key={i}
            style={{
              background: "#1e293b",
              color: "white",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "15px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
            }}
          >
            <h3>🏥 {h.name}</h3>

            <p style={{ color: "#94a3b8" }}>Multi-speciality Hospital</p>

            <p>⭐ {rating} | 100+ reviews</p>

            <p style={{ color: "#22c55e" }}>
              📍 {h.distance.toFixed(2)} km away
            </p>
          </div>
        );
      })}
    </div>
  );
}
