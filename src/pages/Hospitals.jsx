import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [coords, setCoords] = useState(null);

  const navigate = useNavigate();

  /* FETCH */
  const fetchHospitals = async (lat, lng) => {
    try {
      const res = await fetch(
        "https://astracare-backend.onrender.com/api/hospitals/search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng, query: "" }),
        },
      );

      const data = await res.json();

      setHospitals(data.hospitals || []);
      setCoords({ lat, lng });
    } catch (err) {
      console.log(err);
    }
  };

  /* LOCATION */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      fetchHospitals(pos.coords.latitude, pos.coords.longitude);
    });
  }, []);

  /* 🚑 BOOK */
  const handleRoute = (h) => {
    const data = {
      user: coords,
      hospital: h,
      ambulance: coords,
    };

    localStorage.setItem("trackingData", JSON.stringify(data));
    navigate("/tracking");
  };

  return (
    <div>
      <h2>🏥 Hospitals</h2>

      {hospitals.map((h, i) => (
        <div key={i} style={{ marginBottom: "15px" }}>
          <h3>{h.name}</h3>

          <button onClick={() => handleRoute(h)}>🚑 Book Ambulance</button>
        </div>
      ))}
    </div>
  );
}
