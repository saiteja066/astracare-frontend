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
  const [loading, setLoading] = useState(false);

  const ambIndex = useRef(0);

  const data = JSON.parse(localStorage.getItem("trackingData"));

  const userLat = data?.user?.lat || 17.385;
  const userLng = data?.user?.lng || 78.486;

  /* 🔎 SEARCH */
  useEffect(() => {
    if (!data?.user || query.length < 2) {
      setResults([]);
      return;
    }

    const fetchSearch = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          "https://astracare-backend.onrender.com/api/hospitals/search",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lat: userLat,
              lng: userLng,
              query,
            }),
          },
        );

        const result = await res.json();
        setResults(result.hospitals || []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchSearch, 400);
    return () => clearTimeout(delay);
  }, [query]);

  /* 🚀 ROUTE */
  const createRoute = async (hospital) => {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${hospital.lng},${hospital.lat}?overview=full&geometries=geojson`,
    );

    const json = await res.json();

    const coords = json.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);

    setRoute(coords);
    setAmbulancePos([userLat, userLng]);
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
    }, 150);

    return () => clearInterval(interval);
  }, [route]);

  return (
    <div style={{ padding: "20px" }}>
      <input
        placeholder="Search hospital..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <p>Searching...</p>}

      {results.map((r, i) => (
        <div
          key={i}
          onClick={() => {
            setSelectedHospital(r);
            createRoute(r);
            setResults([]);
          }}
        >
          🏥 {r.name}
        </div>
      ))}

      <MapContainer
        center={[userLat, userLng]}
        zoom={13}
        style={{ height: "500px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Follow pos={ambulancePos} />

        {route.length > 0 && <Polyline positions={route} />}

        {selectedHospital && (
          <Marker
            position={[selectedHospital.lat, selectedHospital.lng]}
            icon={hospitalIcon}
          >
            <Popup>{selectedHospital.name}</Popup>
          </Marker>
        )}

        {ambulancePos && (
          <Marker position={ambulancePos} icon={ambulanceIcon}>
            <Popup>🚑 Ambulance</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
