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
  iconSize: [42, 42],
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1484/1484842.png",
  iconSize: [36, 36],
});

/* FOLLOW */
function Follow({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 15);
  }, [pos]);
  return null;
}

/* DISTANCE */
function getDistance(lat1, lon1, lat2, lon2) {
  const dx = lat1 - lat2;
  const dy = lon1 - lon2;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function MapView() {
  const [route, setRoute] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [manualHospital, setManualHospital] = useState(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [userLocation, setUserLocation] = useState(null);

  const ambIndex = useRef(0);

  /* 📍 GET USER LOCATION */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  /* 🔎 SEARCH */
  useEffect(() => {
    if (query.length < 3 || !userLocation) {
      setResults([]);
      return;
    }

    const fetchHospitals = async () => {
      setLoading(true);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}+hospital&limit=10`,
        );

        let data = await res.json();

        data = data.filter((d) =>
          d.display_name.toLowerCase().includes("hospital"),
        );

        // sort by distance
        data.sort((a, b) => {
          const d1 = getDistance(
            userLocation.lat,
            userLocation.lng,
            parseFloat(a.lat),
            parseFloat(a.lon),
          );

          const d2 = getDistance(
            userLocation.lat,
            userLocation.lng,
            parseFloat(b.lat),
            parseFloat(b.lon),
          );

          return d1 - d2;
        });

        setResults(data);
      } catch (err) {
        console.log(err);
      }

      setLoading(false);
    };

    const delay = setTimeout(fetchHospitals, 400);
    return () => clearTimeout(delay);
  }, [query, userLocation]);

  /* 🚀 ROUTE FETCH */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("trackingData"));
    if (!data || !manualHospital) return;

    const { ambulance } = data;

    const fetchRoute = async () => {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${ambulance.lng},${ambulance.lat};${manualHospital.lng},${manualHospital.lat}?overview=full&geometries=geojson`,
      );

      const json = await res.json();

      if (!json.routes?.length) return;

      const coords = json.routes[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);

      setRoute(coords);
      setAmbulancePos(coords[0]);
      ambIndex.current = 0;
    };

    fetchRoute();
  }, [manualHospital]);

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
    }, 150);

    return () => clearInterval(interval);
  }, [route]);

  /* 🔘 SEARCH BUTTON */
  const handleSearch = () => {
    if (!results.length) return;

    const best = results[0];

    setManualHospital({
      lat: parseFloat(best.lat),
      lng: parseFloat(best.lon),
    });

    setQuery(best.display_name);
    setResults([]);
  };

  return (
    <div style={{ padding: "10px" }}>
      {/* 🔎 SEARCH UI */}
      <div style={{ position: "relative", maxWidth: "450px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            placeholder="Search hospitals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #ccc",
            }}
          />

          <button
            onClick={handleSearch}
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              border: "none",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </div>

        {/* RESULTS */}
        {results.length > 0 && (
          <div
            style={{
              position: "absolute",
              width: "100%",
              background: "white",
              borderRadius: "12px",
              marginTop: "5px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              zIndex: 1000,
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {results.map((r, i) => {
              const parts = r.display_name.split(",");
              const name = parts[0];
              const city = parts[parts.length - 3] || "";

              return (
                <div
                  key={i}
                  onClick={() => {
                    setManualHospital({
                      lat: parseFloat(r.lat),
                      lng: parseFloat(r.lon),
                    });
                    setQuery(r.display_name);
                    setResults([]);
                  }}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  🏥 <b>{name}</b>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    📍 {city}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading && <div style={{ fontSize: "12px" }}>Searching...</div>}
      </div>

      {/* MAP */}
      <MapContainer
        center={[17.24, 78.24]}
        zoom={13}
        style={{ height: "500px", marginTop: "10px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Follow pos={ambulancePos} />

        {/* ROUTE */}
        {route.length > 0 && (
          <Polyline positions={route} pathOptions={{ color: "green" }} />
        )}

        {/* HOSPITAL */}
        {manualHospital && (
          <Marker
            position={[manualHospital.lat, manualHospital.lng]}
            icon={hospitalIcon}
          >
            <Popup>🏥 Selected Hospital</Popup>
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
