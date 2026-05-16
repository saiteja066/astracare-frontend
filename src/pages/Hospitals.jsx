import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate } from "react-router-dom";

/* FIX marker issue */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  /* FETCH */
  const fetchHospitals = async (lat, lng) => {
    setLoading(true);

    try {
      const res = await fetch(
        "https://astracare-backend.onrender.com/api/hospitals",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng }),
        },
      );

      const data = await res.json();

      setHospitals(data.hospitals || []);
      setCoords({ lat, lng });
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  /* LOCATION */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchHospitals(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        fetchHospitals(17.385, 78.486); // fallback
      },
    );
  }, []);

  /* MAP CENTER */
  function MapUpdater({ coords }) {
    const map = useMap();

    useEffect(() => {
      if (coords) {
        map.flyTo([coords.lat, coords.lng], 13);
      }
    }, [coords]);

    return null;
  }

  /* BOOK */
  const handleRoute = (h) => {
    const data = {
      user: coords,
      hospital: h,
      ambulance: coords,
    };

    localStorage.setItem("trackingData", JSON.stringify(data));
    navigate("/map");
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div>
      <h2>🏥 Nearby Hospitals</h2>

      {/* MAP */}
      {coords && (
        <div style={{ height: "300px", marginBottom: "20px" }}>
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={13}
            style={{ height: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapUpdater coords={coords} />

            {hospitals.map((h, i) => (
              <Marker key={i} position={[h.lat, h.lng]}>
                <Popup>{h.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* LIST */}
      {hospitals.map((h, i) => (
        <div key={i}>
          <p>{h.name}</p>
          <button onClick={() => handleRoute(h)}>🚑 Book Ambulance</button>
        </div>
      ))}
    </div>
  );
}
