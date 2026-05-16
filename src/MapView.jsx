import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// 🔥 Fix default marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// 🚑 Ambulance
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [35, 35],
});

// 🚗 Car
const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
  iconSize: [30, 30],
});

// 📍 User
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [30, 30],
});

// 🏥 Hospital
const hospitalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1484/1484842.png",
  iconSize: [35, 35],
});

// 🚦 Signal Icons
const redSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463612.png",
  iconSize: [25, 25],
});

const greenSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463626.png",
  iconSize: [25, 25],
});

const yellowSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463621.png",
  iconSize: [25, 25],
});

// 🎯 Signal icon selector
const getSignalIcon = (status) => {
  if (status === "green") return greenSignal;
  if (status === "red") return redSignal;
  return yellowSignal;
};

// 🗺️ Smooth map movement
function MapUpdater({ target }) {
  const map = useMap();

  useEffect(() => {
    if (target?.user) {
      map.flyTo([target.user.lat, target.user.lng], 14, {
        duration: 1.5,
      });
    }
  }, [target]);

  return null;
}

export default function MapView({ signals = [], target }) {
  const [route, setRoute] = useState([]);

  const center = target?.user
    ? [target.user.lat, target.user.lng]
    : [17.385, 78.4867];

  // 🚀 Fetch real route
  useEffect(() => {
    if (target?.user && target?.hospital) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${target.user.lng},${target.user.lat};${target.hospital.lng},${target.hospital.lat}?overview=full&geometries=geojson`,
          );

          const data = await res.json();

          if (data.routes?.length) {
            const coords = data.routes[0].geometry.coordinates.map((c) => [
              c[1],
              c[0],
            ]);
            setRoute(coords);
          }
        } catch (err) {
          console.log("Route fetch error");
        }
      };

      fetchRoute();
    }
  }, [target]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <MapUpdater target={target} />

      {/* 📍 USER */}
      {target?.user && (
        <Marker position={[target.user.lat, target.user.lng]} icon={userIcon}>
          <Popup>📍 You</Popup>
        </Marker>
      )}

      {/* 🚑 AMBULANCE */}
      {target?.ambulance && (
        <Marker
          position={[target.ambulance.lat, target.ambulance.lng]}
          icon={ambulanceIcon}
        >
          <Popup>🚑 Ambulance</Popup>
        </Marker>
      )}

      {/* 🏥 HOSPITAL */}
      {target?.hospital && (
        <Marker
          position={[target.hospital.lat, target.hospital.lng]}
          icon={hospitalIcon}
        >
          <Popup>🏥 Hospital</Popup>
        </Marker>
      )}

      {/* 🚗 CARS (optional) */}
      {target?.cars?.map((c, i) => (
        <Marker key={i} position={[c.lat, c.lng]} icon={carIcon}>
          <Popup>🚗 Car</Popup>
        </Marker>
      ))}

      {/* 🚦 SIGNALS */}
      {signals.map((s, i) => (
        <Marker
          key={i}
          position={[s.lat, s.lng]}
          icon={getSignalIcon(s.status)}
        >
          <Popup>
            🚦 Signal <br />
            Status: {s.status}
            {s.override && <br />}
            {s.override && "🚑 Priority Active"}
          </Popup>
        </Marker>
      ))}

      {/* 🛣️ ROUTE */}
      {route.length > 0 && (
        <Polyline
          positions={route}
          pathOptions={{ color: "#3b82f6", weight: 5 }}
        />
      )}
    </MapContainer>
  );
}
