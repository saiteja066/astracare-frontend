import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* FIX ICON */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* 🚑 REAL AMBULANCE ICON */
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

/* 🚦 TRAFFIC SIGNAL (3 LIGHT STYLE) */
const signalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

/* 🎯 AUTO FOLLOW */
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
  const [vehicles, setVehicles] = useState([]);
  const [signals, setSignals] = useState([]);

  /* LOAD DATA + ROUTE */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("trackingData"));
    if (!data) return;

    const { user, ambulance } = data;

    const fetchRoute = async () => {
      const url = `https://router.project-osrm.org/route/v1/driving/${ambulance.lng},${ambulance.lat};${user.lng},${user.lat}?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.routes?.length) {
        const coords = json.routes[0].geometry.coordinates.map((c) => [
          c[1],
          c[0],
        ]);

        setRoute(coords);

        /* 🚦 SIGNALS ON ROUTE */
        setSignals([
          coords[Math.floor(coords.length * 0.3)],
          coords[Math.floor(coords.length * 0.6)],
          coords[Math.floor(coords.length * 0.8)],
        ]);

        /* 🚗 VEHICLES ON ROUTE */
        setVehicles([
          { id: 1, index: 10 },
          { id: 2, index: 25 },
          { id: 3, index: 40 },
        ]);

        setAmbulancePos(coords[0]);
      }
    };

    fetchRoute();
  }, []);

  /* 🚑 AMBULANCE MOVE */
  useEffect(() => {
    if (!route.length) return;

    let i = 0;

    const interval = setInterval(() => {
      if (i < route.length) {
        setAmbulancePos(route[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [route]);

  /* 🚗 VEHICLE MOVE */
  useEffect(() => {
    if (!route.length) return;

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => ({
          ...v,
          index: (v.index + 1) % route.length,
        })),
      );
    }, 200);

    return () => clearInterval(interval);
  }, [route]);

  return (
    <MapContainer center={[17.24, 78.24]} zoom={14} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Follow pos={ambulancePos} />

      {/* 🛣️ ROUTE */}
      {route.length > 0 && (
        <Polyline
          positions={route}
          pathOptions={{ color: "green", weight: 5 }}
        />
      )}

      {/* 🚑 AMBULANCE */}
      {ambulancePos && (
        <Marker position={ambulancePos} icon={ambulanceIcon}>
          <Popup>🚑 Ambulance</Popup>
        </Marker>
      )}

      {/* 🚗 VEHICLES ON ROUTE */}
      {vehicles.map((v) => (
        <Marker key={v.id} position={route[v.index]} icon={carIcon}>
          <Popup>🚗 Vehicle</Popup>
        </Marker>
      ))}

      {/* 🚦 SIGNALS */}
      {signals.map((s, i) => (
        <Marker key={i} position={s} icon={signalIcon}>
          <Popup>🚦 Signal</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
