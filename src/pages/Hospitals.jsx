import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [coords, setCoords] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  /* 🚀 FETCH HOSPITALS */
  const fetchHospitals = async (lat, lng, searchQuery = "") => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        "https://astracare-backend.onrender.com/api/hospitals/search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat,
            lng,
            query: searchQuery,
          }),
        },
      );

      const data = await res.json();

      console.log("API RESPONSE 👉", data);

      const sorted = (data.hospitals || [])
        .map((h) => ({
          ...h,
          distance: getDistance(lat, lng, h.lat, h.lng),
        }))
        .sort((a, b) => a.distance - b.distance);

      setHospitals(sorted);
      setCoords({ lat, lng });
    } catch (err) {
      console.log("Fetch error:", err);
      setError("❌ Failed to load hospitals");
    }

    setLoading(false);
  };

  /* 📍 GET LOCATION */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchHospitals(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // 🔥 fallback (Hyderabad)
        fetchHospitals(17.385, 78.486);
      },
    );
  }, []);

  /* 🔍 SEARCH */
  const handleSearch = () => {
    if (!coords) return;
    fetchHospitals(coords.lat, coords.lng, query);
  };

  /* 🗺️ MAP UPDATE */
  function MapUpdater({ coords }) {
    const map = useMap();

    useEffect(() => {
      if (coords) {
        map.flyTo([coords.lat, coords.lng], 13);
      }
    }, [coords]);

    return null;
  }

  /* 🚑 BOOK AMBULANCE */
  const handleRoute = (h) => {
    const data = {
      user: coords,
      hospital: h,
      ambulance: coords,
    };

    localStorage.setItem("trackingData", JSON.stringify(data));
    navigate("/map");
  };

  return (
    <div>
      <h2>🏥 Hospitals Near You</h2>

      {/* 🔍 SEARCH */}
      <div style={{ marginBottom: "15px" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search hospital..."
          style={{ padding: "8px", width: "70%" }}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {/* 🔄 LOADING */}
      {loading && <p>🔄 Loading hospitals...</p>}

      {/* ❌ ERROR */}
      {error && <p>{error}</p>}

      {/* ❌ NO DATA */}
      {!loading && hospitals.length === 0 && <p>No hospitals found ❌</p>}

      {/* 🗺️ MAP */}
      {coords && (
        <div style={{ height: "300px", marginBottom: "20px" }}>
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
                  📍 {h.distance.toFixed(2)} km
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* 🏥 LIST */}
      {hospitals.map((h, i) => (
        <div
          key={i}
          style={{
            background: "#1e293b",
            color: "white",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "10px",
          }}
        >
          <h3>{h.name}</h3>
          <p>📍 {h.distance.toFixed(2)} km away</p>

          <button onClick={() => handleRoute(h)}>🚑 Book Ambulance</button>
        </div>
      ))}
    </div>
  );
}
