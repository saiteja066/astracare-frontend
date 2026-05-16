import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* 🚑 Icons */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [40, 40],
});

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [30, 30],
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1484/1484842.png",
  iconSize: [35, 35],
});

/* 🗺️ Auto-follow ambulance */
function Follow({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position]);

  return null;
}

export default function MapView() {
  const [data, setData] = useState(null);
  const [route, setRoute] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [arrived, setArrived] = useState(false);

  /* 📦 Load tracking data */
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("trackingData"));

    if (stored) {
      setData(stored);
      setAmbulancePos([stored.ambulance.lat, stored.ambulance.lng]);
    }
  }, []);

  /* 🛣️ Fetch route */
  useEffect(() => {
    if (!data) return;

    const fetchRoute = async () => {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${data.ambulance.lng},${data.ambulance.lat};${data.hospital.lng},${data.hospital.lat}?overview=full&geometries=geojson`,
        );

        const result = await res.json();

        if (result.routes?.length) {
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
  }, [data]);

  /* 🚑 Animate ambulance */
  useEffect(() => {
    if (!route.length) return;

    let i = 0;

    const interval = setInterval(() => {
      if (i < route.length) {
        setAmbulancePos(route[i]);
        i++;
      } else {
        clearInterval(interval);
        setArrived(true);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [route]);

  if (!data) return <h2>Loading map...</h2>;

  return (
    <div>
      <h2>🗺️ Live Ambulance Map</h2>

      {arrived && <p style={{ color: "green" }}>✅ Ambulance Arrived</p>}

      <div style={{ height: "500px" }}>
        <MapContainer
          center={[data.user.lat, data.user.lng]}
          zoom={14}
          style={{ height: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Follow position={ambulancePos} />

          {/* 📍 USER */}
          <Marker position={[data.user.lat, data.user.lng]} icon={userIcon} />

          {/* 🏥 HOSPITAL */}
          <Marker
            position={[data.hospital.lat, data.hospital.lng]}
            icon={hospitalIcon}
          />

          {/* 🚑 AMBULANCE */}
          {ambulancePos && (
            <Marker position={ambulancePos} icon={ambulanceIcon} />
          )}

          {/* 🛣️ ROUTE */}
          {route.length > 0 && <Polyline positions={route} />}
        </MapContainer>
      </div>
    </div>
  );
}
