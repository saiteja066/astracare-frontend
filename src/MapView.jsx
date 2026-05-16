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

/* 🚦 ICONS */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [35, 35],
});

export default function MapView({ signals = [], target = {} }) {
  const [vehicles, setVehicles] = useState([]);

  /* 🚗 SOCKET */
  useEffect(() => {
    socket.on("vehicleUpdate", (data) => {
      if (Array.isArray(data)) {
        setVehicles(data);
      }
    });

    return () => socket.off("vehicleUpdate");
  }, []);

  /* 🚑 LOAD FROM STORAGE (KEY FIX) */
  const stored = JSON.parse(localStorage.getItem("trackingData"));
  const ambulance = target?.ambulance || stored?.ambulance;

  return (
    <MapContainer center={[17.24, 78.24]} zoom={12} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 🚗 VEHICLES */}
      {vehicles.map((v, i) => (
        <Marker key={i} position={[v.lat, v.lng]}>
          <Popup>🚗</Popup>
        </Marker>
      ))}

      {/* 🚑 AMBULANCE */}
      {ambulance && (
        <Marker position={[ambulance.lat, ambulance.lng]} icon={ambulanceIcon}>
          <Popup>🚑 Ambulance</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
