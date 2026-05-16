import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* 🔥 FIX MARKER ICON */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* 🔌 SOCKET */
const socket = io("https://astracare-backend.onrender.com", {
  transports: ["polling", "websocket"],
});

/* 🚦 SIGNAL ICONS */
const redSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463612.png",
  iconSize: [25, 25],
});

const orangeSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463621.png",
  iconSize: [25, 25],
});

const greenSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463626.png",
  iconSize: [25, 25],
});

const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [35, 35],
});

/* 🚦 TRAFFIC LOGIC */
function getTrafficLevel(vehicles, lat, lng) {
  if (!Array.isArray(vehicles) || vehicles.length === 0) return "green";

  const nearby = vehicles.filter(
    (v) =>
      v &&
      typeof v.lat === "number" &&
      typeof v.lng === "number" &&
      Math.abs(v.lat - lat) < 0.01 &&
      Math.abs(v.lng - lng) < 0.01,
  );

  if (nearby.length === 0) return "green";

  const avgSpeed =
    nearby.reduce((sum, v) => sum + (v.speed || 0), 0) / nearby.length;

  const score = nearby.length / (avgSpeed || 1);

  if (score > 8) return "red";
  if (score > 4) return "orange";
  return "green";
}

function getSignalIcon(status) {
  if (status === "red") return redSignal;
  if (status === "orange") return orangeSignal;
  return greenSignal;
}

export default function MapView({ signals = [], target = {} }) {
  const [vehicles, setVehicles] = useState([
    // 🔥 fallback vehicles (so UI never empty)
    { lat: 17.22, lng: 78.22, speed: 20 },
    { lat: 17.24, lng: 78.23, speed: 15 },
  ]);

  /* 🚗 SOCKET */
  useEffect(() => {
    socket.on("vehicleUpdate", (data) => {
      console.log("Socket:", data);

      if (Array.isArray(data) && data.length > 0) {
        setVehicles(data);
      }
    });

    return () => socket.off("vehicleUpdate");
  }, []);

  return (
    <MapContainer
      center={[17.24, 78.24]}
      zoom={12}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 🚗 VEHICLES */}
      {Array.isArray(vehicles) &&
        vehicles.map((v, i) => (
          <Marker key={i} position={[v.lat, v.lng]}>
            <Popup>🚗 {v.speed?.toFixed(1)} km/h</Popup>
          </Marker>
        ))}

      {/* 🚦 SIGNALS */}
      {signals.map((s, i) => {
        const traffic = getTrafficLevel(vehicles, s.lat, s.lng);

        return (
          <Marker
            key={i}
            position={[s.lat, s.lng]}
            icon={getSignalIcon(traffic)}
          >
            <Popup>🚦 Traffic: {traffic}</Popup>
          </Marker>
        );
      })}

      {/* 🚑 AMBULANCE */}
      {target?.ambulance && (
        <Marker
          position={[target.ambulance.lat, target.ambulance.lng]}
          icon={ambulanceIcon}
        >
          <Popup>🚑 Ambulance</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
