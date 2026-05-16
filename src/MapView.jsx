import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ICONS */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [40, 40],
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1484/1484842.png",
  iconSize: [35, 35],
});

/* FOLLOW */
function Follow({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 15);
  }, [pos]);
  return null;
}

export default function MapView() {
  const [route, setRoute] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const ambIndex = useRef(0);

  /* 📦 LOAD USER */
  const data = JSON.parse(localStorage.getItem("trackingData"));

  /* 🔎 SEARCH (ONLY WHEN TYPING) */
  useEffect(() => {
    if (!data || query.length < 2) {
      setResults([]);
      return;
    }

    const fetchSearch = async () => {
      try {
        const res = await fetch(
          "https://astracare-backend.onrender.com/api/hospitals/search",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lat: data.user.lat,
              lng: data.user.lng,
              query,
            }),
          },
        );

        const result = await res.json();
        setResults(result.hospitals || []);
      } catch (err) {
        console.log(err);
      }
    };

    const delay = setTimeout(fetchSearch, 400);
    return () => clearTimeout(delay);
  }, [query]);

  /* 🚀 ROUTE ONLY AFTER SELECT */
  const createRoute = async (hospital) => {
    if (!data) return;

    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${data.user.lng},${data.user.lat};${hospital.lng},${hospital.lat}?overview=full&geometries=geojson`,
    );

    const json = await res.json();

    const coords = json.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);

    setRoute(coords);
    setAmbulancePos([data.user.lat, data.user.lng]);
    ambIndex.current = 0;
  };

  /* 🚑 MOVE */
  useEffect(() => {
    if (!route.length) return;

    const interval = setInterval(() => {
      if (ambIndex.current >= route.length - 1) {
        clearInterval(interval);
        return;
      }

      ambIndex.current++;
      setAmbulancePos(route[ambIndex.current]);
    }, 200);

    return () => clearInterval(interval);
  }, [route]);

  /* 🔘 SEARCH BUTTON */
  const handleSearch = () => {
    if (results.length > 0) {
      const hospital = results[0]; // best match
      setSelectedHospital(hospital);
      createRoute(hospital);
      setResults([]);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* 🔥 CLEAN SEARCH BAR */}
      <div style={{ maxWidth: "500px", marginBottom: "10px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            placeholder="Search hospital..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "14px",
            }}
          />

          <button
            onClick={handleSearch}
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              border: "none",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Search
          </button>
        </div>

        {/* 🔥 SUGGESTIONS */}
        {results.length > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: "10px",
              marginTop: "5px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {results.map((r, i) => (
              <div
                key={i}
                onClick={() => {
                  setSelectedHospital(r);
                  setQuery(r.name);
                  setResults([]);
                  createRoute(r);
                }}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
              >
                🏥 {r.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🗺️ MAP */}
      <MapContainer
        center={[data?.user.lat || 17.24, data?.user.lng || 78.24]}
        zoom={13}
        style={{ height: "500px", borderRadius: "15px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Follow pos={ambulancePos} />

        {/* ROUTE */}
        {route.length > 0 && (
          <Polyline positions={route} pathOptions={{ color: "#22c55e" }} />
        )}

        {/* HOSPITAL */}
        {selectedHospital && (
          <Marker
            position={[selectedHospital.lat, selectedHospital.lng]}
            icon={hospitalIcon}
          >
            <Popup>{selectedHospital.name}</Popup>
          </Marker>
        )}

        {/* AMBULANCE */}
        {ambulancePos && (
          <Marker position={ambulancePos} icon={ambulanceIcon}>
            <Popup>🚑 Ambulance</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
