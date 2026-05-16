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

/* FIX DEFAULT ICON */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* 🚑 AMBULANCE ICON */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

/* 🚗 CAR ICON */
const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

/* 🚦 SIGNAL ICON */
const signalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

/* 🎯 AUTO FOLLOW */
function Follow({ pos }) {
  const map = useMap();

  useEffect(() => {
    if (pos && Array.isArray(pos)) {
      map.flyTo(pos, 15);
    }
  }, [pos]);

  return null;
}

export default function MapView() {
  const [route, setRoute] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [signals, setSignals] = useState([]);
  const [center, setCenter] = useState([17.24, 78.24]);

  /* 📦 LOAD + ROUTE */
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("trackingData"));
      if (!data?.user || !data?.ambulance) return;

      const { user, ambulance } = data;

      setCenter([user.lat, user.lng]);
      setAmbulancePos([ambulance.lat, ambulance.lng]);

      const fetchRoute = async () => {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${ambulance.lng},${ambulance.lat};${user.lng},${user.lat}?overview=full&geometries=geojson`;

          const res = await fetch(url);
          const json = await res.json();

          if (json?.routes?.length > 0) {
            const coords = json.routes[0].geometry.coordinates.map((c) => [
              c[1],
              c[0],
            ]);

            setRoute(coords);

            /* 🚦 SIGNALS */
            setSignals([
              coords[Math.floor(coords.length * 0.3)],
              coords[Math.floor(coords.length * 0.6)],
              coords[Math.floor(coords.length * 0.8)],
            ]);

            /* 🚗 VEHICLES */
            setVehicles([
              { id: 1, index: 10 },
              { id: 2, index: 30 },
              { id: 3, index: 50 },
            ]);
          }
        } catch (err) {
          console.log("Route error:", err);
        }
      };

      fetchRoute();
    } catch (err) {
      console.log("Storage error:", err);
    }
  }, []);

  /* 🚑 AMBULANCE MOVE */
  useEffect(() => {
    if (!Array.isArray(route) || route.length === 0) return;

    let i = 0;

    const interval = setInterval(() => {
      if (route[i]) {
        setAmbulancePos(route[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [route]);

  /* 🚗 VEHICLE MOVE */
  useEffect(() => {
    if (!Array.isArray(route) || route.length === 0) return;

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => ({
          ...v,
          index: (v.index + 1) % route.length,
        })),
      );
    }, 250);

    return () => clearInterval(interval);
  }, [route]);

  return (
    <MapContainer center={center} zoom={14} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 🎯 FOLLOW */}
      <Follow pos={ambulancePos} />

      {/* 🛣️ ROUTE */}
      {Array.isArray(route) && route.length > 0 && (
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

      {/* 🚗 VEHICLES (SAFE) */}
      {vehicles.map((v) => {
        if (!route[v.index]) return null;

        return (
          <Marker key={v.id} position={route[v.index]} icon={carIcon}>
            <Popup>🚗 Vehicle</Popup>
          </Marker>
        );
      })}

      {/* 🚦 SIGNALS (SAFE) */}
      {signals.map((s, i) => {
        if (!s) return null;

        return (
          <Marker key={i} position={s} icon={signalIcon}>
            <Popup>🚦 Signal</Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
