import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useNavigate } from "react-router-dom";

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [coords, setCoords] = useState(null);
  const [place, setPlace] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // 📏 DISTANCE
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // 🧠 SPECIALIZATION
  function getDescription(h) {
    const name = h.tags?.name?.toLowerCase() || "";

    let specialization = "Multi-speciality";

    if (name.includes("women") || name.includes("maternity")) {
      specialization = "Gynecology";
    } else if (name.includes("heart") || name.includes("cardiac")) {
      specialization = "Cardiology";
    } else if (name.includes("child") || name.includes("kids")) {
      specialization = "Pediatrics";
    } else if (name.includes("ortho")) {
      specialization = "Orthopedic";
    } else if (name.includes("eye")) {
      specialization = "Ophthalmology";
    } else if (name.includes("dental")) {
      specialization = "Dental";
    }

    const operator = h.tags?.operator || "Private";

    return `${specialization} • ${operator}`;
  }

  // 🚀 FETCH
  const fetchHospitals = async (lat, lng) => {
    setError("");

    try {
      const res = await fetch(
        "https://astracare-backend.onrender.com/hospitals",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lat, lng }),
        },
      );

      const data = await res.json();

      if (!data.elements?.length) {
        setError("⚠️ No hospitals found nearby");
      }

      const sorted = data.elements
        .map((h) => ({
          ...h,
          distance: getDistance(lat, lng, h.lat, h.lon),
        }))
        .sort((a, b) => a.distance - b.distance);

      setHospitals(sorted);
      setCoords({ lat, lng });
    } catch (err) {
      console.log(err);
      setError("❌ Hospital service busy, try again");
    }
  };

  // 📍 AUTO LOCATION
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchHospitals(pos.coords.latitude, pos.coords.longitude);
      },
      () => setError("❌ Location denied"),
    );
  }, []);

  // 🔍 SEARCH
  const handleSearch = async () => {
    if (!place) return;

    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${place}`,
    );

    const geoData = await geoRes.json();

    if (!geoData.length) {
      setError("❌ Location not found");
      return;
    }

    fetchHospitals(parseFloat(geoData[0].lat), parseFloat(geoData[0].lon));
  };

  // 🖱️ MAP CLICK
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        fetchHospitals(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  // 🔥 AUTO MOVE MAP
  function MapUpdater({ coords }) {
    const map = useMap();

    if (coords) {
      map.flyTo([coords.lat, coords.lng], 14, {
        duration: 1.5,
      });
    }

    return null;
  }

  // 🚑 ROUTE
  const handleRoute = (h) => {
    const data = {
      user: coords,
      hospital: { lat: h.lat, lng: h.lon },
      ambulance: {
        lat: coords.lat + 0.01,
        lng: coords.lng + 0.01,
      },
    };

    localStorage.setItem("trackingData", JSON.stringify(data));
    navigate("/tracking");
  };

  return (
    <div>
      <h2 className="title">🏥 Hospitals Near You</h2>

      {/* 🔍 SEARCH */}
      <div
        className="card"
        style={{
          display: "flex",
          gap: "10px",
          padding: "15px",
          marginBottom: "20px",
        }}
      >
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Search city..."
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            background: "rgba(255,255,255,0.1)",
            color: "white",
          }}
        />
        <button onClick={handleSearch}>🔍</button>
      </div>

      {/* ❌ ERROR */}
      {error && hospitals.length === 0 && (
        <div className="card" style={{ color: "#f87171" }}>
          {error}
        </div>
      )}

      {/* 🗺️ MAP */}
      {coords && (
        <div
          style={{
            height: "260px",
            marginBottom: "25px",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={14}
            style={{ height: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <MapUpdater coords={coords} />
            <MapClickHandler />

            <Marker position={[coords.lat, coords.lng]}>
              <Popup>📍 Selected Location</Popup>
            </Marker>

            {hospitals.map((h, i) => (
              <Marker key={i} position={[h.lat, h.lon]}>
                <Popup>
                  <b>{h.tags?.name || "Hospital"}</b>
                  <br />
                  {getDescription(h)}
                  <br />
                  📏 {h.distance.toFixed(2)} km
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* 🏥 LIST */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {hospitals.map((h, i) => (
          <div key={i} className="card">
            <h3>{h.tags?.name || "Hospital"}</h3>

            <p style={{ color: "#94a3b8" }}>{getDescription(h)}</p>

            <p style={{ color: "#38bdf8" }}>
              📍 {h.distance.toFixed(2)} km away
            </p>

            <button
              onClick={() => handleRoute(h)}
              style={{
                marginTop: "10px",
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "white",
              }}
            >
              🏥 Choose This Hospital
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
