import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* 🔥 FIX DEFAULT MARKER ICON */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* 🔌 SOCKET CONNECTION */
const socket = io("https://astracare-backend.onrender.com", {
  transports: ["polling", "websocket"],
});

/* 🚗 VEHICLE ICON */
const vehicleIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743922.png",
  iconSize: [25, 25],
});

/* 🚑 AMBULANCE ICON */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [35, 35],
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

/* 🚦 TRAFFIC LOGIC */
function getTrafficLevel(vehicles, lat, lng) {
  if (!Array.isArray(vehicles) || vehicles.length === 0) return "green";

  const nearby = vehicles.filter(
    (v) => Math.abs(v.lat - lat) < 0.01 && Math.abs(v.lng - lng) < 0.01,
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
  const [vehicles, setVehicles] = useState([]);

  /* 🚗 SOCKET DATA */
  useEffect(() => {
    socket.on("vehicleUpdate", (data) => {
      console.log("Socket:", data);

      if (Array.isArray(data)) {
        setVehicles(data);
      }
    });

    return () => socket.off("vehicleUpdate");
  }, []);

  /* 🚑 GET AMBULANCE FROM STATE OR STORAGE */
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem("trackingData"));
  } catch {}

  const ambulance = target?.ambulance || stored?.ambulance;

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
          <Marker key={i} position={[v.lat, v.lng]} icon={vehicleIcon}>
            <Popup>🚗 Speed: {v.speed?.toFixed(1)} km/h</Popup>
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
      {ambulance && (
        <Marker position={[ambulance.lat, ambulance.lng]} icon={ambulanceIcon}>
          <Popup>🚑 Ambulance</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
