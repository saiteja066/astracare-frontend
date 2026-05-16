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

/* FOLLOW MAP */
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

  const [userLocation, setUserLocation] = useState(null);

  const ambIndex = useRef(0);

  /* 📍 USER LOCATION */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  /* 🔎 HYBRID SEARCH */
  useEffect(() => {
    if (query.length < 2 || !userLocation) {
      setResults([]);
      return;
    }

    const fetchHospitals = async () => {
      try {
        /* 🔥 STEP 1: OVERPASS (NEARBY) */
        const localRes = await fetch(
          `http://localhost:5000/api/hospitals/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}`,
        );

        let localData = await localRes.json();

        const filteredLocal = localData.filter((h) =>
          h.name.toLowerCase().includes(query.toLowerCase()),
        );

        if (filteredLocal.length > 0) {
          setResults(filteredLocal);
          return;
        }

        /* 🔥 STEP 2: FALLBACK */
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}+hospital&limit=5`,
        );

        let data = await res.json();

        const fallback = data.map((d) => ({
          name: d.display_name.split(",")[0],
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
        }));

        setResults(fallback);
      } catch (err) {
        console.log(err);
      }
    };

    const delay = setTimeout(fetchHospitals, 400);
    return () => clearTimeout(delay);
  }, [query, userLocation]);

  /* 🚀 ROUTE (FIXED) */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("trackingData"));
    if (!data || !manualHospital) return;

    const { user } = data;

    const fetchRoute = async () => {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${user.lng},${user.lat};${manualHospital.lng},${manualHospital.lat}?overview=full&geometries=geojson`,
      );

      const json = await res.json();
      if (!json.routes?.length) return;

      const coords = json.routes[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);

      setRoute(coords);
      setAmbulancePos([user.lat, user.lng]);
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
      <div style={{ position: "relative", maxWidth: "400px" }}>
        <input
          placeholder="Search hospitals..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid #ccc",
          }}
        />

        {results.length > 0 && (
          <div
            style={{
              position: "absolute",
              width: "100%",
              background: "white",
              border: "1px solid #ccc",
              borderRadius: "10px",
              marginTop: "5px",
              zIndex: 1000,
            }}
          >
            {results.map((r, i) => (
              <div
                key={i}
                onClick={() => {
                  setManualHospital(r);
                  setQuery(r.name);
                  setResults([]);
                  setRoute([]);
                  ambIndex.current = 0;
                }}
                style={{
                  padding: "10px",
                  cursor: "pointer",
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
        center={[17.24, 78.24]}
        zoom={13}
        style={{ height: "500px", marginTop: "10px" }}
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
            <Popup>🏥 {manualHospital.name}</Popup>
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
