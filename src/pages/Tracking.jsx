import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ICON */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [40, 40],
});

export default function Tracking() {
  const [ambulance, setAmbulance] = useState(null);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("trackingData"));
      if (data?.ambulance) {
        setAmbulance(data.ambulance);
      }
    } catch {}
  }, []);

  if (!ambulance) return <h2>Loading...</h2>;

  return (
    <div>
      <h2>🚑 Tracking</h2>

      <MapContainer
        center={[ambulance.lat, ambulance.lng]}
        zoom={13}
        style={{ height: "500px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker
          position={[ambulance.lat, ambulance.lng]}
          icon={ambulanceIcon}
        />
      </MapContainer>
    </div>
  );
}
