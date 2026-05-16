import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

/* 🔥 FIX MARKER ICON */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* 🔌 SOCKET (FIXED) */
const socket = io("https://astracare-backend.onrender.com", {
  transports: ["polling", "websocket"],
});

/* 🚦 ICONS */
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

/* 🚦 TRAFFIC */
function getTrafficLevel(vehicles, lat, lng) {
  if (!vehicles || vehicles.length === 0) return "green";

  const nearby = vehicles.filter(
    (v) => Math.abs(v.lat - lat) < 0.01 && Math.abs(v.lng - lng) < 0.01,
  );

  if (!nearby.length) return "green";

  const avgSpeed = nearby.reduce((sum, v) => sum + v.speed, 0) / nearby.length;

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

/* 🔥 HEATMAP */
function Heatmap({ vehicles }) {
  const map = useMap();

  useEffect(() => {
    if (!vehicles || vehicles.length === 0) return;

    const heatLayer = L.heatLayer(
      vehicles.map((v) => [v.lat, v.lng, v.speed < 15 ? 1 : 0.3]),
      { radius: 25, blur: 15 },
    );

    heatLayer.addTo(map);

    return () => map.removeLayer(heatLayer);
  }, [vehicles, map]);

  return null;
}

export default function MapView({ signals = [], target = {} }) {
  const [vehicles, setVehicles] = useState([
    // 🔥 fallback (IMPORTANT)
    { lat: 17.22, lng: 78.22, speed: 20 },
    { lat: 17.24, lng: 78.23, speed: 10 },
  ]);

  useEffect(() => {
    socket.on("vehicleUpdate", (data) => {
      console.log("Socket:", data);

      if (data && Array.isArray(data) && data.length > 0) {
        setVehicles(data);
      }
    });

    return () => socket.off("vehicleUpdate");
  }, []);

  return (
    <MapContainer center={[17.24, 78.24]} zoom={12} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Heatmap vehicles={vehicles} />

      {/* 🚗 VEHICLES */}
      {vehicles.map((v, i) => (
        <Marker key={i} position={[v.lat, v.lng]}>
          <Popup>🚗 {v.speed.toFixed(1)} km/h</Popup>
        </Marker>
      ))}

      {/* 🚦 SIGNALS */}
      {signals.map((s, i) => {
        const t = getTrafficLevel(vehicles, s.lat, s.lng);
        return (
          <Marker key={i} position={[s.lat, s.lng]} icon={getSignalIcon(t)}>
            <Popup>🚦 {t}</Popup>
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
