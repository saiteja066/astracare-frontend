import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* 🔥 FIX MARKER */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* SOCKET */
const socket = io("https://astracare-backend.onrender.com", {
  transports: ["polling", "websocket"],
});

/* ICONS */
const vehicleIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743922.png",
  iconSize: [25, 25],
});

const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [35, 35],
});

export default function MapView({ signals = [], target = {} }) {
  const [vehicles, setVehicles] = useState([]);
  const [route, setRoute] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);

  /* 🚗 SOCKET VEHICLES */
  useEffect(() => {
    socket.on("vehicleUpdate", (data) => {
      if (Array.isArray(data)) setVehicles(data);
    });

    return () => socket.off("vehicleUpdate");
  }, []);

  /* 📦 LOAD TRACKING DATA */
  const stored = JSON.parse(localStorage.getItem("trackingData"));

  /* 🛣️ FETCH ROUTE */
  useEffect(() => {
    if (!stored?.user || !stored?.ambulance) return;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${stored.ambulance.lng},${stored.ambulance.lat};${stored.user.lng},${stored.user.lat}?overview=full&geometries=geojson`;

        const res = await fetch(url);
        const result = await res.json();

        if (result?.routes?.length > 0) {
          const coords = result.routes[0].geometry.coordinates.map((c) => [
            c[1],
            c[0],
          ]);

          setRoute(coords);
          setAmbulancePos(coords[0]);
        }
      } catch (err) {
        console.log("Route error:", err);
      }
    };

    fetchRoute();
  }, []);

  /* 🚑 ANIMATION */
  useEffect(() => {
    if (!Array.isArray(route) || route.length === 0) return;

    let i = 0;

    const interval = setInterval(() => {
      if (i < route.length) {
        setAmbulancePos(route[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [route]);

  return (
    <MapContainer center={[17.24, 78.24]} zoom={13} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 🚗 VEHICLES */}
      {vehicles.map((v, i) => (
        <Marker key={i} position={[v.lat, v.lng]} icon={vehicleIcon}>
          <Popup>🚗</Popup>
        </Marker>
      ))}

      {/* 🛣️ ROUTE */}
      {route.length > 0 && <Polyline positions={route} color="green" />}

      {/* 🚑 MOVING AMBULANCE */}
      {ambulancePos && (
        <Marker position={ambulancePos} icon={ambulanceIcon}>
          <Popup>🚑 Moving Ambulance</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
