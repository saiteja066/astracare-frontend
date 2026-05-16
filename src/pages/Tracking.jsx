import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ICONS */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [40, 40],
});

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [30, 30],
});

function MapUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) map.flyTo(position, 15);
  }, [position]);

  return null;
}

export default function Tracking() {
  const [data, setData] = useState(null);
  const [route, setRoute] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);

  /* LOAD DATA */
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("trackingData"));
    console.log("Tracking data:", stored);

    if (stored) {
      setData(stored);
      setAmbulancePos([stored.ambulance.lat, stored.ambulance.lng]);
    }
  }, []);

  /* FETCH ROUTE */
  useEffect(() => {
    if (!data) return;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${data.ambulance.lng},${data.ambulance.lat};${data.user.lng},${data.user.lat}?overview=full&geometries=geojson`;

        const res = await fetch(url);
        const result = await res.json();

        console.log("Route API:", result);

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
  }, [data]);

  /* ANIMATION */
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

  if (!data) return <h2>Loading...</h2>;

  return (
    <div>
      <h2>🚑 Tracking</h2>

      <MapContainer
        center={[data.user.lat, data.user.lng]}
        zoom={14}
        style={{ height: "500px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapUpdater position={ambulancePos} />

        {/* USER */}
        <Marker position={[data.user.lat, data.user.lng]} icon={userIcon} />

        {/* AMBULANCE */}
        {ambulancePos && (
          <Marker position={ambulancePos} icon={ambulanceIcon} />
        )}

        {/* ROUTE */}
        {Array.isArray(route) && route.length > 0 && (
          <Polyline positions={route} color="green" />
        )}
      </MapContainer>
    </div>
  );
}
