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
  const [manualHospital, setManualHospital] = useState(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const ambIndex = useRef(0);

  /* 📦 LOAD DATA */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("trackingData"));
    if (data) {
      setManualHospital(data.hospital);
      setAmbulancePos([data.user.lat, data.user.lng]);
    }
  }, []);

  /* 🔎 SEARCH */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("trackingData"));
    if (!data || query.length < 2) return;

    const fetchSearch = async () => {
      const res = await fetch("http://localhost:5000/api/hospitals/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: data.user.lat,
          lng: data.user.lng,
          query,
        }),
      });

      const result = await res.json();
      setResults(result.hospitals);
    };

    const delay = setTimeout(fetchSearch, 400);
    return () => clearTimeout(delay);
  }, [query]);

  /* 🚀 ROUTE */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("trackingData"));
    if (!data || !manualHospital) return;

    const fetchRoute = async () => {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${data.user.lng},${data.user.lat};${manualHospital.lng},${manualHospital.lat}?overview=full&geometries=geojson`,
      );

      const json = await res.json();

      const coords = json.routes[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);

      setRoute(coords);
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
    }, 200);

    return () => clearInterval(interval);
  }, [route]);

  return (
    <div style={{ padding: "10px" }}>
      {/* 🔎 SEARCH */}
      <input
        placeholder="Search hospital..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {results.map((r, i) => (
        <div
          key={i}
          onClick={() => {
            setManualHospital(r);
            setQuery(r.name);
            setResults([]);
          }}
        >
          🏥 {r.name}
        </div>
      ))}

      {/* MAP */}
      <MapContainer
        center={[17.24, 78.24]}
        zoom={13}
        style={{ height: "500px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Follow pos={ambulancePos} />

        {route.length > 0 && (
          <Polyline positions={route} pathOptions={{ color: "green" }} />
        )}

        {manualHospital && (
          <Marker
            position={[manualHospital.lat, manualHospital.lng]}
            icon={hospitalIcon}
          >
            <Popup>{manualHospital.name}</Popup>
          </Marker>
        )}

        {ambulancePos && (
          <Marker position={ambulancePos} icon={ambulanceIcon}>
            <Popup>Ambulance</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
