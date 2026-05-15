import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";

import { useEffect, useState } from "react";

export default function Tracking({ target }) {
  const [route, setRoute] = useState([]);

  const saved = localStorage.getItem("trackingData");
  const finalTarget = target || (saved ? JSON.parse(saved) : null);

  useEffect(() => {
    if (!finalTarget) return;

    const { ambulance, user, hospital } = finalTarget;

    const url = `https://router.project-osrm.org/route/v1/driving/${ambulance.lng},${ambulance.lat};${user.lng},${user.lat};${hospital.lng},${hospital.lat}?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!data.routes) return;

        const coords = data.routes[0].geometry.coordinates.map((c) => [
          c[1],
          c[0],
        ]);

        setRoute(coords);
      });
  }, [finalTarget]);

  if (!finalTarget) return <h2>No tracking data</h2>;

  return (
    <div className="card">
      <h2>🚑 Tracking</h2>

      <div style={{ height: "500px" }}>
        <MapContainer
          center={[finalTarget.user.lat, finalTarget.user.lng]}
          zoom={14}
          style={{ height: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Marker
            position={[finalTarget.ambulance.lat, finalTarget.ambulance.lng]}
          >
            <Popup>🚑 Ambulance</Popup>
          </Marker>

          <Marker position={[finalTarget.user.lat, finalTarget.user.lng]}>
            <Popup>📍 You</Popup>
          </Marker>

          <Marker
            position={[finalTarget.hospital.lat, finalTarget.hospital.lng]}
          >
            <Popup>🏥 Hospital</Popup>
          </Marker>

          {route.length > 0 && <Polyline positions={route} color="cyan" />}
        </MapContainer>
      </div>
    </div>
  );
}
