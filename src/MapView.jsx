import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

const socket = io("https://astracare-backend.onrender.com");

/* 🚦 Signal Icons */
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

export default function MapView({ signals, target }) {
  const [vehicles, setVehicles] = useState([]);

  /* 🚗 LIVE VEHICLES */
  useEffect(() => {
    socket.on("vehicleUpdate", (data) => {
      setVehicles(data);
    });

    return () => socket.off("vehicleUpdate");
  }, []);

  /* 🔥 HEATMAP */
  useEffect(() => {
    if (!vehicles.length) return;

    const heatData = vehicles.map((v) => [
      v.lat,
      v.lng,
      v.speed < 15 ? 1 : 0.3,
    ]);

    const heat = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
    });

    return () => {
      heat.remove();
    };
  }, [vehicles]);

  return (
    <MapContainer
      center={[17.385, 78.4867]}
      zoom={13}
      style={{ height: "500px" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 🚗 VEHICLES */}
      {vehicles.map((v, i) => (
        <Marker key={i} position={[v.lat, v.lng]}>
          <Popup>🚗 Speed: {v.speed.toFixed(1)} km/h</Popup>
        </Marker>
      ))}

      {/* 🚦 SIGNALS WITH TRAFFIC */}
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
