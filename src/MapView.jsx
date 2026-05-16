import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

export default function MapView() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("trackingData"));
    setData(stored);
  }, []);

  if (!data) return <h2>Loading map...</h2>;

  return (
    <MapContainer
      center={[data.user.lat, data.user.lng]}
      zoom={13}
      style={{ height: "500px" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Marker position={[data.user.lat, data.user.lng]} />
      <Marker position={[data.hospital.lat, data.hospital.lng]} />
    </MapContainer>
  );
}
