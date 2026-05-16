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

/* 🔥 FIX DEFAULT ICON */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* 🚑 AMBULANCE */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [42, 42],
  iconAnchor: [21, 42],
});

/* 🚗 CAR */
const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

/* 🚦 SIGNAL ICONS */
const redSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463612.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const greenSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463626.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

/* 🎯 FOLLOW AMBULANCE */
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
        `https://router.project-osrm.org/route/v1/driving/${ambulance.lng},${ambulance.lat};${user.lng},${user.lat}?overview=full&geometries=geojson`,
      );

      const json = await res.json();

      const coords = json.routes[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);

      setRoute(coords);
      setAmbulancePos(coords[0]);

      /* 🚦 SIGNALS (fixed positions) */
      setSignals([
        { index: 30, status: "red" },
        { index: 70, status: "red" },
      ]);

      /* 🚗 VEHICLES */
      setVehicles([
        { id: 1, index: 20 },
        { id: 2, index: 50 },
      ]);
    };

    fetchRoute();
  }, []);

  /* 🚑 AMBULANCE MOVEMENT */
  useEffect(() => {
    if (!route.length) return;

    const interval = setInterval(() => {
      ambIndex.current++;

      if (route[ambIndex.current]) {
        setAmbulancePos(route[ambIndex.current]);
      }

      /* 🚦 SIGNAL CONTROL */
      setSignals((prev) =>
        prev.map((s) => {
          // ambulance near → GREEN
          if (Math.abs(s.index - ambIndex.current) < 5) {
            return { ...s, status: "green" };
          }
          // after crossing → RED again
          if (ambIndex.current > s.index + 5) {
            return { ...s, status: "red" };
          }
          return s;
        }),
      );
    }, 200);

    return () => clearInterval(interval);
  }, [route]);

  /* 🚗 VEHICLE BEHAVIOR */
  useEffect(() => {
    if (!route.length) return;

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          const signalAhead = signals.find(
            (s) => Math.abs(s.index - v.index) < 3,
          );

          // 🔴 STOP if red signal
          if (signalAhead && signalAhead.status === "red") {
            return v;
          }

          // 🟢 MOVE if green
          return {
            ...v,
            index: (v.index + 1) % route.length,
          };
        }),
      );
    }, 250);

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
              <Popup>🚗 Vehicle</Popup>
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
