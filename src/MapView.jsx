import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* FIX DEFAULT ICON */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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
const signalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

/* FOLLOW */
function Follow({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 15, { duration: 0.5 });
  }, [pos]);
  return null;
}

/* ---- Helpers for smooth path ---- */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function dist(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/* Resample route into evenly spaced points */
function resample(coords, step = 0.0002) {
  if (!coords || coords.length < 2) return coords || [];
  const out = [coords[0]];
  let prev = coords[0];

  for (let i = 1; i < coords.length; i++) {
    const curr = coords[i];
    let d = dist(prev, curr);

    while (d > step) {
      const t = step / d;
      const nx = lerp(prev[0], curr[0], t);
      const ny = lerp(prev[1], curr[1], t);
      const next = [nx, ny];
      out.push(next);
      prev = next;
      d = dist(prev, curr);
    }
    out.push(curr);
    prev = curr;
  }
  return out;
}

export default function MapView() {
  const [rawRoute, setRawRoute] = useState([]);
  const [route, setRoute] = useState([]); // resampled (smooth)
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [signals, setSignals] = useState([]);
  const [center, setCenter] = useState([17.24, 78.24]);

  // moving indices
  const ambIndex = useRef(0);
  const vehicleStates = useRef([
    { id: 1, index: 20, speed: 1.0 },
    { id: 2, index: 80, speed: 0.7 },
    { id: 3, index: 140, speed: 0.9 },
  ]);

  /* Load + fetch route */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("trackingData"));
    if (!data?.user || !data?.ambulance) return;

    const { user, ambulance } = data;
    setCenter([user.lat, user.lng]);

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${ambulance.lng},${ambulance.lat};${user.lng},${user.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const json = await res.json();

        if (json?.routes?.length) {
          const coords = json.routes[0].geometry.coordinates.map((c) => [
            c[1],
            c[0],
          ]);

          setRawRoute(coords);

          // create smooth route
          const smooth = resample(coords, 0.00015);
          setRoute(smooth);

          // place signals along route
          setSignals([
            smooth[Math.floor(smooth.length * 0.25)],
            smooth[Math.floor(smooth.length * 0.5)],
            smooth[Math.floor(smooth.length * 0.75)],
          ]);

          ambIndex.current = 0;
          setAmbulancePos(smooth[0]);
        }
      } catch (e) {
        console.log(e);
      }
    };

    fetchRoute();
  }, []);

  /* Smooth animation loop (shared clock) */
  useEffect(() => {
    if (!route.length) return;

    let rafId;
    const tick = () => {
      // ambulance
      ambIndex.current = (ambIndex.current + 1) % route.length;
      setAmbulancePos(route[ambIndex.current]);

      // vehicles (different speeds, same path, looped)
      vehicleStates.current = vehicleStates.current.map((v) => ({
        ...v,
        index: (v.index + v.speed) % route.length,
      }));

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [route]);

  // memo positions to avoid extra renders
  const vehiclePositions = useMemo(() => {
    if (!route.length) return [];
    return vehicleStates.current.map((v) => {
      const i = Math.floor(v.index) % route.length;
      return { id: v.id, pos: route[i] };
    });
  }, [route, ambulancePos]); // recalc as animation advances

  return (
    <MapContainer center={center} zoom={14} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Follow pos={ambulancePos} />

      {/* show original route faint + smooth route bold */}
      {rawRoute.length > 0 && (
        <Polyline
          positions={rawRoute}
          pathOptions={{ color: "#9ca3af", weight: 2 }}
        />
      )}
      {route.length > 0 && (
        <Polyline
          positions={route}
          pathOptions={{ color: "green", weight: 5 }}
        />
      )}

      {/* Ambulance */}
      {ambulancePos && (
        <Marker position={ambulancePos} icon={ambulanceIcon}>
          <Popup>🚑 Ambulance</Popup>
        </Marker>
      )}

      {/* Vehicles (no disappearing, looped) */}
      {vehiclePositions.map((v) => (
        <Marker key={v.id} position={v.pos} icon={carIcon}>
          <Popup>🚗 Vehicle</Popup>
        </Marker>
      ))}

      {/* Signals on route */}
      {signals.map(
        (s, i) =>
          s && (
            <Marker key={i} position={s} icon={signalIcon}>
              <Popup>🚦 Signal</Popup>
            </Marker>
          ),
      )}
    </MapContainer>
  );
}
