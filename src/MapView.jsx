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

/* FIX ICON BUG */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ICONS */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [40, 40],
});

const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743922.png",
  iconSize: [28, 28],
});

const redSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463612.png",
  iconSize: [25, 25],
});

const greenSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463626.png",
  iconSize: [25, 25],
});

/* FOLLOW */
function Follow({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 15);
  }, [pos]);
  return null;
}

export default function MapView() {
  const data = JSON.parse(localStorage.getItem("trackingData"));

  const [route, setRoute] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [signals, setSignals] = useState([]);

  const ambIndex = useRef(0);

  /* 🚗 STATIC VEHICLES */
  useEffect(() => {
    if (!data) return;

    const base = data.user;

    const v = Array.from({ length: 8 }).map(() => ({
      lat: base.lat + (Math.random() - 0.5) * 0.01,
      lng: base.lng + (Math.random() - 0.5) * 0.01,
    }));

    setVehicles(v);
  }, []);

  /* 🚦 STATIC SIGNALS */
  useEffect(() => {
    if (!data) return;

    const base = data.user;

    const s = Array.from({ length: 4 }).map(() => ({
      lat: base.lat + (Math.random() - 0.5) * 0.02,
      lng: base.lng + (Math.random() - 0.5) * 0.02,
      state: "green",
    }));

    setSignals(s);
  }, []);

  /* 🚀 ROUTE */
  useEffect(() => {
    if (!data) return;

    const fetchRoute = async () => {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${data.user.lng},${data.user.lat};${data.hospital.lng},${data.hospital.lat}?overview=full&geometries=geojson`,
      );

      const json = await res.json();

      const coords = json.routes[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);

      setRoute(coords);
      setAmbulancePos(coords[0]);
      ambIndex.current = 0;
    };

    fetchRoute();
  }, []);

  /* 🚑 AMBULANCE MOVE */
  useEffect(() => {
    if (!route.length) return;

    const interval = setInterval(() => {
      if (ambIndex.current >= route.length - 1) {
        clearInterval(interval);
        return;
      }

      ambIndex.current++;
      setAmbulancePos(route[ambIndex.current]);
    }, 250);

    return () => clearInterval(interval);
  }, [route]);

  /* 🚗 VEHICLE MOVE */
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => ({
          lat: v.lat + (Math.random() - 0.5) * 0.0005,
          lng: v.lng + (Math.random() - 0.5) * 0.0005,
        })),
      );
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer
      center={[data?.user.lat || 17.24, data?.user.lng || 78.24]}
      zoom={14}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Follow pos={ambulancePos} />

      {/* ROUTE */}
      {route.length > 0 && (
        <Polyline positions={route} pathOptions={{ color: "green" }} />
      )}

      {/* 🚑 AMBULANCE */}
      {ambulancePos && (
        <Marker position={ambulancePos} icon={ambulanceIcon}>
          <Popup>🚑 Ambulance</Popup>
        </Marker>
      )}

      {/* 🚗 VEHICLES */}
      {vehicles.map((v, i) => (
        <Marker key={i} position={[v.lat, v.lng]} icon={carIcon} />
      ))}

      {/* 🚦 SIGNALS */}
      {signals.map((s, i) => (
        <Marker
          key={i}
          position={[s.lat, s.lng]}
          icon={s.state === "red" ? redSignal : greenSignal}
        />
      ))}
    </MapContainer>
  );
}
