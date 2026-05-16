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

/* 🔥 FIX DEFAULT ICON */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* 🚑 AMBULANCE */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/809/809957.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

/* 🚗 CAR */
const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1048/1048313.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

/* 🚦 SIGNAL */
const signalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

/* 🎯 AUTO FOLLOW AMBULANCE */
function MapAutoFocus({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15); // zoom + focus
    }
  }, [position]);

  return null;
}

export default function MapView() {
  const [vehicles, setVehicles] = useState([]);
  const [signals, setSignals] = useState([]);
  const [route, setRoute] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [center, setCenter] = useState([17.24, 78.24]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("trackingData"));
    if (!data) return;

    const { user, ambulance } = data;

    setCenter([user.lat, user.lng]);
    setAmbulancePos([ambulance.lat, ambulance.lng]);

    /* 🚗 SPREAD VEHICLES (NO CROWDING) */
    const v = [
      { id: 1, lat: user.lat + 0.004, lng: user.lng + 0.004 },
      { id: 2, lat: user.lat - 0.004, lng: user.lng + 0.003 },
      { id: 3, lat: user.lat + 0.003, lng: user.lng - 0.004 },
      { id: 4, lat: user.lat - 0.005, lng: user.lng - 0.003 },
    ];
    setVehicles(v);

    /* 🚦 SPREAD SIGNALS */
    const s = [
      { id: 1, lat: user.lat + 0.006, lng: user.lng + 0.002 },
      { id: 2, lat: user.lat - 0.006, lng: user.lng - 0.002 },
      { id: 3, lat: user.lat + 0.002, lng: user.lng - 0.006 },
    ];
    setSignals(s);

    /* 🛣️ ROUTE */
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${ambulance.lng},${ambulance.lat};${user.lng},${user.lat}?overview=full&geometries=geojson`;

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
        console.log(err);
      }
    };

    fetchRoute();
  }, []);

  /* 🚑 MOVEMENT */
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
    }, 250);

    return () => clearInterval(interval);
  }, [route]);

  return (
    <MapContainer center={center} zoom={14} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 🎯 AUTO ZOOM */}
      <MapAutoFocus position={ambulancePos} />

      {/* 🚗 VEHICLES */}
      {vehicles.map((v) => (
        <Marker key={v.id} position={[v.lat, v.lng]} icon={carIcon}>
          <Popup>🚗 Vehicle</Popup>
        </Marker>
      ))}

      {/* 🚦 SIGNALS */}
      {signals.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={signalIcon}>
          <Popup>🚦 Signal</Popup>
        </Marker>
      ))}

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
    </MapContainer>
  );
}
