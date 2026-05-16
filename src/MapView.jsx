import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

/* 🔌 SOCKET */
const socket = io("https://astracare-backend.onrender.com");

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

/* 🚑 ICON */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [35, 35],
});

console.log("vehicles:", vehicles);
console.log("signals:", signals);
console.log("target:", target);

/* 🚦 TRAFFIC LOGIC */
function getTrafficLevel(vehicles, lat, lng) {
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

/* 🔥 HEATMAP COMPONENT (FIXED) */
function Heatmap({ vehicles }) {
  const map = useMap();

  useEffect(() => {
    if (!vehicles.length) return;

    const heatData = vehicles.map((v) => [
      v.lat,
      v.lng,
      v.speed < 15 ? 1 : 0.3,
    ]);

    const heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [vehicles, map]);

  return null;
}

export default function MapView({ signals = [], target }) {
  const [vehicles, setVehicles] = useState([]);

  /* 🚗 SOCKET DATA */
  useEffect(() => {
    socket.on("vehicleUpdate", (data) => {
      setVehicles(data);
    });

    return () => socket.off("vehicleUpdate");
  }, []);

  return (
    <MapContainer
      center={[17.385, 78.4867]}
      zoom={13}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 🔥 HEATMAP */}
      <Heatmap vehicles={vehicles} />

      {/* 🚗 VEHICLES */}
      {vehicles.map((v, i) => (
        <Marker key={i} position={[v.lat, v.lng]}>
          <Popup>🚗 Speed: {v.speed.toFixed(1)} km/h</Popup>
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
            <Popup>
              🚦 Signal <br />
              Traffic: {traffic}
            </Popup>
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
