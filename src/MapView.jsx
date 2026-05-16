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

/* LOCAL HOSPITALS */
const localHospitals = [
  { name: "Vani Hospital", lat: 16.52, lng: 80.62, city: "Local Area" },
];

export default function MapView() {
  const [route, setRoute] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [manualHospital, setManualHospital] = useState(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

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
    if (query.length < 2 || !userLocation) {
      setResults([]);
      return;
    }

    const fetchHospitals = async () => {
      try {
        // 🔥 LOCAL FIRST
        const local = localHospitals.filter((h) =>
          h.name.toLowerCase().includes(query.toLowerCase()),
        );

        // 🔥 API (NEARBY)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}+hospital&limit=10`,
        );

        let data = await res.json();

        data = data
          .filter((d) => d.display_name.toLowerCase().includes("hospital"))
          .map((d) => ({
            name: d.display_name.split(",")[0],
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
            city: d.display_name.split(",").slice(-3)[0],
          }));

        // 🔥 SORT BY DISTANCE
        data.sort((a, b) => {
          const d1 = getDistance(
            userLocation.lat,
            userLocation.lng,
            a.lat,
            a.lng,
          );
          const d2 = getDistance(
            userLocation.lat,
            userLocation.lng,
            b.lat,
            b.lng,
          );
          return d1 - d2;
        });

        setResults([...local, ...data]);
      } catch (err) {
        console.log(err);
      }
    };

    const delay = setTimeout(fetchHospitals, 300);
    return () => clearTimeout(delay);
  }, [query, userLocation]);

  /* 🚀 ROUTE FIXED */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("trackingData"));
    if (!data || !manualHospital) return;

    const { user } = data; // ✅ IMPORTANT FIX

    const fetchRoute = async () => {
      try {
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

        // ✅ START FROM USER
        setAmbulancePos([user.lat, user.lng]);

        ambIndex.current = 0;
      } catch (err) {
        console.log(err);
      }
    };

    fetchRoute();
  }, [manualHospital]);

  /* 🚑 SMOOTH MOVEMENT */
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
      <div style={{ position: "relative", maxWidth: "450px" }}>
        <input
          placeholder="Search hospitals..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #ccc",
          }}
        />

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
            {results.map((r, i) => (
              <div
                key={i}
                onClick={() => {
                  setRoute([]); // 🔥 reset
                  ambIndex.current = 0;

                  setManualHospital({
                    lat: r.lat,
                    lng: r.lng,
                  });

                  setQuery(r.name);
                  setResults([]);
                }}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
              >
                🏥 <b>{r.name}</b>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  📍 {r.city}
                </div>
              </div>
            ))}
          </div>
        )}
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
            <Popup>🏥 Hospital</Popup>
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
