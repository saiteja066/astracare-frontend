import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import L from "leaflet";
import { useEffect, useState } from "react";

/* 🔥 FIX DEFAULT ICON */
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* 🚑 ICONS */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
});

const carIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [32, 32],
});

const greenSignal = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [28, 28],
});

const redSignal = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [28, 28],
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/hospitals.png",
  iconSize: [32, 32],
});

/* 🔥 HEATMAP */
function Heatmap({ vehicles }) {
  const map = useMap();

  useEffect(() => {
    if (!vehicles.length) return;

    const points = vehicles.map((v) => [Number(v.lat), Number(v.lng), 0.5]);

    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [vehicles, map]);

  return null;
}

export default function MapView() {
  /* 🚗 VEHICLES */
  const [vehicles, setVehicles] = useState([
    { id: 1, lat: 17.2, lng: 78.2, type: "ambulance" },
    { id: 2, lat: 17.25, lng: 78.25, type: "car" },
    { id: 3, lat: 17.28, lng: 78.3, type: "car" },
  ]);

  /* 🚦 SIGNALS */
  const [signals, setSignals] = useState([
    { id: 1, lat: 17.22, lng: 78.22, status: "red" },
    { id: 2, lat: 17.26, lng: 78.27, status: "red" },
  ]);

  /* 🏥 HOSPITALS */
  const [hospitals, setHospitals] = useState([]);

  /* 🚨 BLINK */
  const [blink, setBlink] = useState(true);

  /* 📍 FETCH HOSPITALS */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const query = `
        [out:json];
        node["amenity"="hospital"](around:5000,${lat},${lng});
        out;
      `;

      fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      })
        .then((res) => res.json())
        .then((data) => {
          setHospitals(data.elements);

          // 🔥 SAVE FOR EMERGENCY PAGE
          localStorage.setItem("hospitals", JSON.stringify(data.elements));
        });
    });
  }, []);

  /* 🚨 BLINK EFFECT */
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  /* 🚗 LIVE MOVEMENT */
  useEffect(() => {
    const move = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => ({
          ...v,
          lat: v.lat + (Math.random() - 0.5) * 0.002,
          lng: v.lng + (Math.random() - 0.5) * 0.002,
        })),
      );
    }, 2000);

    return () => clearInterval(move);
  }, []);

  /* 🚦 SMART SIGNAL */
  useEffect(() => {
    const ambulance = vehicles.find((v) => v.type === "ambulance");
    if (!ambulance) return;

    const updated = signals.map((s) => {
      const dist = Math.sqrt(
        (s.lat - ambulance.lat) ** 2 + (s.lng - ambulance.lng) ** 2,
      );

      return {
        ...s,
        status: dist < 0.02 ? "green" : "red",
      };
    });

    setSignals(updated);
  }, [vehicles]);

  /* 🛣️ ROUTE (VISUAL) */
  const route = vehicles.map((v) => [v.lat, v.lng]);

  return (
    <div style={{ height: "500px", width: "100%" }}>
      <MapContainer
        center={[17.2, 78.2]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 🔥 HEATMAP */}
        <Heatmap vehicles={vehicles} />

        {/* 🛣️ ROUTE */}
        <Polyline positions={route} color="cyan" weight={4} />

        {/* 🚗 VEHICLES */}
        {vehicles.map((v) => {
          const isAmb = v.type === "ambulance";

          return (
            <Marker
              key={v.id}
              position={[v.lat, v.lng]}
              icon={isAmb ? ambulanceIcon : carIcon}
            >
              <Popup>{isAmb ? "🚑 Ambulance" : "🚗 Car"}</Popup>
            </Marker>
          );
        })}

        {/* 🚨 BLINK */}
        {vehicles.map((v) =>
          v.type === "ambulance" ? (
            <CircleMarker
              key={`b-${v.id}`}
              center={[v.lat, v.lng]}
              radius={blink ? 20 : 10}
              pathOptions={{
                color: "red",
                fillOpacity: 0.2,
              }}
            />
          ) : null,
        )}

        {/* 🚦 SIGNALS */}
        {signals.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={s.status === "green" ? greenSignal : redSignal}
          >
            <Popup>🚦 Signal: {s.status.toUpperCase()}</Popup>
          </Marker>
        ))}

        {/* 🏥 HOSPITALS */}
        {hospitals.map((h, i) => (
          <Marker key={`h-${i}`} position={[h.lat, h.lon]} icon={hospitalIcon}>
            <Popup>🏥 {h.tags?.name || "Hospital"}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
