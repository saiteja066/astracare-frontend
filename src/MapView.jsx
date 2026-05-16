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

const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
  iconSize: [28, 28],
});

const redSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463612.png",
  iconSize: [32, 32],
});

const greenSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463626.png",
  iconSize: [32, 32],
});

/* FOLLOW */
function Follow({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 15);
  }, [pos]);
  return null;
}

/* DISTANCE FUNCTION (approx) */
function getDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export default function MapView() {
  const [route, setRoute] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [signals, setSignals] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const ambIndex = useRef(0);

  /* 🚀 LOAD ROUTE */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("trackingData"));
    if (!data) return;

    const { user, ambulance } = data;

    const fetchRoute = async () => {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${ambulance.lng},${ambulance.lat};${user.lng},${user.lat}?alternatives=true&overview=full&geometries=geojson`,
      );

      const json = await res.json();

      const bestRoute = json.routes[0]; // simple best

      const coords = bestRoute.geometry.coordinates.map((c) => [c[1], c[0]]);

      setRoute(coords);
      setAmbulancePos(coords[0]);

      const total = coords.length;

      /* 🚦 SIGNALS */
      setSignals([
        { index: Math.floor(total * 0.3), status: "red" },
        { index: Math.floor(total * 0.6), status: "red" },
      ]);

      /* 🚗 VEHICLES */
      setVehicles([
        { id: 1, index: Math.floor(total * 0.25) },
        { id: 2, index: Math.floor(total * 0.55) },
      ]);
    };

    fetchRoute();
  }, []);

  /* 🚑 AMBULANCE MOVEMENT */
  useEffect(() => {
    if (!route.length) return;

    const interval = setInterval(() => {
      ambIndex.current = (ambIndex.current + 1) % route.length;

      const ambPos = route[ambIndex.current];
      setAmbulancePos(ambPos);

      /* 🚦 PRE-EMPTION LOGIC */
      setSignals((prev) =>
        prev.map((s) => {
          const signalPos = route[s.index];
          if (!signalPos || !ambPos) return s;

          const distance = getDistance(signalPos, ambPos);

          // 🔥 ~500m BEFORE (tunable)
          if (distance < 0.005 && ambIndex.current < s.index) {
            return { ...s, status: "green" };
          }

          // AFTER ambulance crosses → back to red
          if (ambIndex.current > s.index + 5) {
            return { ...s, status: "red" };
          }

          return s;
        }),
      );
    }, 150);

    return () => clearInterval(interval);
  }, [route]);

  /* 🚗 VEHICLE LOGIC */
  useEffect(() => {
    if (!route.length) return;

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          const signalAhead = signals.find(
            (s) => s.index > v.index && s.index - v.index < 5,
          );

          // 🔴 STOP BEFORE SIGNAL
          if (signalAhead && signalAhead.status === "red") {
            return v;
          }

          // 🟢 MOVE
          return {
            ...v,
            index: (v.index + 1) % route.length,
          };
        }),
      );
    }, 200);

    return () => clearInterval(interval);
  }, [signals, route]);

  return (
    <MapContainer center={[17.24, 78.24]} zoom={14} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Follow pos={ambulancePos} />

      {/* 🛣️ ROUTE */}
      {route.length > 0 && (
        <Polyline positions={route} pathOptions={{ color: "green" }} />
      )}

      {/* 🚑 AMBULANCE */}
      {ambulancePos && (
        <Marker position={ambulancePos} icon={ambulanceIcon}>
          <Popup>🚑 Ambulance Priority</Popup>
        </Marker>
      )}

      {/* 🚗 VEHICLES */}
      {vehicles.map(
        (v) =>
          route[v.index] && (
            <Marker key={v.id} position={route[v.index]} icon={carIcon}>
              <Popup>🚗 Waiting / Moving</Popup>
            </Marker>
          ),
      )}

      {/* 🚦 SIGNALS */}
      {signals.map((s, i) =>
        route[s.index] ? (
          <Marker
            key={i}
            position={route[s.index]}
            icon={s.status === "red" ? redSignal : greenSignal}
          >
            <Popup>🚦 {s.status.toUpperCase()}</Popup>
          </Marker>
        ) : null,
      )}
    </MapContainer>
  );
}
