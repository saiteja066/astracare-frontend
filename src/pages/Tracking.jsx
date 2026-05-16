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

/* 🗺️ Auto follow */
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
  const [arrived, setArrived] = useState(false);

  /* 📦 Load data */
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("trackingData"));

      if (stored && stored.ambulance && stored.user) {
        setData(stored);
        setAmbulancePos([stored.ambulance.lat, stored.ambulance.lng]);
      }
    } catch (err) {
      console.log("Storage error:", err);
    }
  }, []);

  /* 🛣️ Fetch route */
  useEffect(() => {
    if (!data) return;

    const fetchRoute = async () => {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${data.ambulance.lng},${data.ambulance.lat};${data.user.lng},${data.user.lat}?overview=full&geometries=geojson`,
        );

        const result = await res.json();

        if (result?.routes?.length > 0) {
          const coords = result.routes[0].geometry.coordinates.map((c) => [
            c[1],
            c[0],
          ]);

          setRoute(coords || []);

          const time = result.routes[0].duration / 60;
          setEta(time.toFixed(1) + " mins");
        }
      } catch (err) {
        console.log("Route error:", err);
      }
    };

    fetchRoute();
  }, [data]);

  /* 🚑 Animate */
  useEffect(() => {
    if (!Array.isArray(route) || route.length === 0) return;

    let i = 0;

    const interval = setInterval(() => {
      if (i < route.length) {
        setAmbulancePos(route[i]);
        i++;
      } else {
        clearInterval(interval);
        setArrived(true);
        setRoute([]);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [route]);

  if (!data) return <h2>Loading...</h2>;

  return (
    <div>
      <h2 className="title">🚑 Ambulance Tracking</h2>

      {arrived && (
        <div
          className="card"
          style={{
            background: "#16a34a",
            color: "white",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          🚑 Ambulance has arrived!
        </div>
      )}

      <div className="card" style={{ marginBottom: "15px" }}>
        {arrived ? (
          <b>✅ Arrived</b>
        ) : (
          <>
            ⏱️ ETA: <b>{eta}</b>
          </>
        )}
      </div>

      <div style={{ height: "500px", borderRadius: "16px" }}>
        <MapContainer
          center={[data.user.lat, data.user.lng]}
          zoom={14}
          style={{ height: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <MapUpdater position={ambulancePos} />

          <Marker position={[data.user.lat, data.user.lng]} icon={userIcon} />

          <Marker
            position={[data.hospital.lat, data.hospital.lng]}
            icon={hospitalIcon}
          />

          {ambulancePos && (
            <Marker position={ambulancePos} icon={ambulanceIcon} />
          )}

          {Array.isArray(route) && route.length > 0 && (
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
