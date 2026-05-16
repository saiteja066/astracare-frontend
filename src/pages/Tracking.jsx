import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// 🚑 Ambulance Icon
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [40, 40],
});

// 📍 User Icon
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [30, 30],
});

// 🏥 Hospital Icon
const hospitalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1484/1484842.png",
  iconSize: [35, 35],
});

// 🗺️ Auto Center
function MapUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position]);

  return null;
}

export default function Tracking() {
  const [data, setData] = useState(null);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [route, setRoute] = useState([]);
  const [eta, setEta] = useState("");

  /* 📦 LOAD DATA */
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("trackingData"));
    if (stored) {
      setData(stored);
      setAmbulancePos([stored.ambulance.lat, stored.ambulance.lng]);
    }
  }, []);

  /* 🛣️ FETCH ROUTE */
  useEffect(() => {
    if (!data) return;

    const fetchRoute = async () => {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${data.ambulance.lng},${data.ambulance.lat};${data.user.lng},${data.user.lat}?overview=full&geometries=geojson`,
      );

      const result = await res.json();

      if (result.routes?.length) {
        const coords = result.routes[0].geometry.coordinates.map((c) => [
          c[1],
          c[0],
        ]);

        setRoute(coords);

        // ⏱️ ETA
        const time = result.routes[0].duration / 60;
        setEta(time.toFixed(1) + " mins");
      }
    };

    fetchRoute();
  }, [data]);

  /* 🚑 ANIMATION */
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
    }, 300);

    return () => clearInterval(interval);
  }, [route]);

  if (!data) return <h2>Loading...</h2>;

  return (
    <div>
      <h2 className="title">🚑 Ambulance Tracking</h2>

      {/* ETA */}
      <div className="card" style={{ marginBottom: "15px" }}>
        ⏱️ Estimated Arrival: <b>{eta}</b>
      </div>

      {/* MAP */}
      <div
        style={{ height: "500px", borderRadius: "16px", overflow: "hidden" }}
      >
        <MapContainer
          center={[data.user.lat, data.user.lng]}
          zoom={14}
          style={{ height: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <MapUpdater position={ambulancePos} />

          {/* USER */}
          <Marker position={[data.user.lat, data.user.lng]} icon={userIcon} />

          {/* HOSPITAL */}
          <Marker
            position={[data.hospital.lat, data.hospital.lng]}
            icon={hospitalIcon}
          />

          {/* 🚑 MOVING AMBULANCE */}
          {ambulancePos && (
            <Marker position={ambulancePos} icon={ambulanceIcon} />
          )}

          {/* ROUTE */}
          {route.length > 0 && (
            <Polyline
              positions={route}
              pathOptions={{ color: "#22c55e", weight: 5 }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
