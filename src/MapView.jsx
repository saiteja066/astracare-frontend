import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* 🔥 FIX ICON */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* 🚗 CAR ICON */
const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743922.png",
  iconSize: [25, 25],
});

/* 🚑 AMBULANCE ICON */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [35, 35],
});

/* 🚦 SIGNAL ICON */
const signalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463626.png",
  iconSize: [25, 25],
});

export default function MapView({ signals = [] }) {
  const [route, setRoute] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);

  /* 🔥 STATIC VEHICLES (OLD STYLE) */
  const vehicles = [
    { id: 1, lat: 17.22, lng: 78.22 },
    { id: 2, lat: 17.25, lng: 78.25 },
    { id: 3, lat: 17.26, lng: 78.24 },
  ];

  /* 📦 LOAD TRACKING DATA */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("trackingData"));
    if (!data) return;

    setAmbulancePos([data.ambulance.lat, data.ambulance.lng]);

    /* 🛣️ FETCH ROUTE */
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${data.ambulance.lng},${data.ambulance.lat};${data.user.lng},${data.user.lat}?overview=full&geometries=geojson`;

        const res = await fetch(url);
        const result = await res.json();

        if (result?.routes?.length > 0) {
          const coords = result.routes[0].geometry.coordinates.map((c) => [
            c[1],
            c[0],
          ]);
          setRoute(coords);
        }
      } catch (err) {
        console.log("Route error:", err);
      }
    };

    fetchRoute();
  }, []);

  return (
    <MapContainer center={[17.24, 78.24]} zoom={13} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 🚗 CARS */}
      {vehicles.map((v) => (
        <Marker key={v.id} position={[v.lat, v.lng]} icon={carIcon}>
          <Popup>🚗 Car</Popup>
        </Marker>
      ))}

      {/* 🚦 SIGNALS */}
      {signals.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={signalIcon}>
          <Popup>🚦 Signal</Popup>
        </Marker>
      ))}

      {/* 🛣️ ROUTE */}
      {route.length > 0 && <Polyline positions={route} color="green" />}

      {/* 🚑 AMBULANCE */}
      {ambulancePos && (
        <Marker position={ambulancePos} icon={ambulanceIcon}>
          <Popup>🚑 Ambulance</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
