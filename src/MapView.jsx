import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ICONS */
const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [42, 42],
  iconAnchor: [21, 42],
});

const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1484/1484842.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const redSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463612.png",
  iconSize: [32, 32],
});

const greenSignal = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463626.png",
  iconSize: [32, 32],
});

/* FOLLOW */
function Follow({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 15);
  }, [pos]);
  return null;
}

/* DISTANCE */
function getDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export default function MapView() {
  const [route, setRoute] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [signals, setSignals] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [arrived, setArrived] = useState(false);

  /* 🏥 manual override */
  const [manualHospital, setManualHospital] = useState(null);
  const [inputLat, setInputLat] = useState("");
  const [inputLng, setInputLng] = useState("");

  const ambIndex = useRef(0);

  /* LOAD DATA */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("trackingData"));
    if (!data) return;

    const { hospital } = data;

    setManualHospital(hospital); // default
  }, []);

  /* FETCH ROUTE */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("trackingData"));
    if (!data || !manualHospital) return;

    const { ambulance } = data;

    const fetchRoute = async () => {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${ambulance.lng},${ambulance.lat};${manualHospital.lng},${manualHospital.lat}?overview=full&geometries=geojson`,
      );

      const json = await res.json();

      const coords = json.routes[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);

      setRoute(coords);
      setAmbulancePos(coords[0]);
      ambIndex.current = 0;
      setArrived(false);

      const total = coords.length;

      setSignals([
        { index: Math.floor(total * 0.3), status: "red" },
        { index: Math.floor(total * 0.6), status: "red" },
      ]);

      setVehicles([
        { id: 1, index: Math.floor(total * 0.2) },
        { id: 2, index: Math.floor(total * 0.5) },
      ]);
    };

    fetchRoute();
  }, [manualHospital]);

  /* 🚑 AMBULANCE */
  useEffect(() => {
    if (!route.length) return;

    const interval = setInterval(() => {
      if (ambIndex.current >= route.length - 1) {
        clearInterval(interval);
        setArrived(true);

        setSignals((prev) => prev.map((s) => ({ ...s, status: "red" })));
        return;
      }

      ambIndex.current++;
      const ambPos = route[ambIndex.current];
      setAmbulancePos(ambPos);

      /* 🚦 PRE-EMPTION */
      setSignals((prev) =>
        prev.map((s) => {
          const signalPos = route[s.index];
          if (!signalPos || !ambPos) return s;

          const dist = getDistance(signalPos, ambPos);

          if (dist < 0.005 && ambIndex.current < s.index) {
            return { ...s, status: "green" };
          }

          if (ambIndex.current > s.index + 5) {
            return { ...s, status: "red" };
          }

          return s;
        }),
      );
    }, 150);

    return () => clearInterval(interval);
  }, [route]);

  /* 🚗 VEHICLES */
  useEffect(() => {
    if (!route.length) return;

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          const signalAhead = signals.find(
            (s) => s.index > v.index && s.index - v.index < 5,
          );

          if (signalAhead && signalAhead.status === "red") {
            return v;
          }

          return {
            ...v,
            index: (v.index + 1) % route.length,
          };
        }),
      );
    }, 200);

    return () => clearInterval(interval);
  }, [signals, route]);

  /* 🏥 CHANGE HOSPITAL */
  const updateHospital = () => {
    if (!inputLat || !inputLng) return;

    setManualHospital({
      lat: parseFloat(inputLat),
      lng: parseFloat(inputLng),
    });
  };

  return (
    <div>
      {/* 🏥 INPUT */}
      <div style={{ marginBottom: "10px" }}>
        <input
          placeholder="Hospital Lat"
          value={inputLat}
          onChange={(e) => setInputLat(e.target.value)}
        />
        <input
          placeholder="Hospital Lng"
          value={inputLng}
          onChange={(e) => setInputLng(e.target.value)}
        />
        <button onClick={updateHospital}>Change Hospital</button>
      </div>

      {/* ARRIVAL */}
      {arrived && (
        <div style={{ background: "green", color: "white", padding: "10px" }}>
          🚑 Reached Hospital
        </div>
      )}

      <MapContainer
        center={[17.24, 78.24]}
        zoom={14}
        style={{ height: "500px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Follow pos={ambulancePos} />

        {/* ROUTE */}
        {route.length > 0 && (
          <Polyline positions={route} pathOptions={{ color: "green" }} />
        )}

        {/* HOSPITAL */}
        {manualHospital && (
          <Marker
            position={[manualHospital.lat, manualHospital.lng]}
            icon={hospitalIcon}
          >
            <Popup>🏥 Hospital</Popup>
          </Marker>
        )}

        {/* AMBULANCE */}
        {ambulancePos && (
          <Marker position={ambulancePos} icon={ambulanceIcon}>
            <Popup>🚑 Ambulance</Popup>
          </Marker>
        )}

        {/* VEHICLES */}
        {vehicles.map(
          (v) =>
            route[v.index] && (
              <Marker key={v.id} position={route[v.index]} icon={carIcon}>
                <Popup>🚗 Vehicle</Popup>
              </Marker>
            ),
        )}

        {/* SIGNALS */}
        {signals.map((s, i) =>
          route[s.index] ? (
            <Marker
              key={i}
              position={route[s.index]}
              icon={s.status === "red" ? redSignal : greenSignal}
            >
              <Popup>🚦 {s.status.toUpperCase()}</Popup>
            </Marker>
          ) : null,
        )}
      </MapContainer>
    </div>
  );
}
