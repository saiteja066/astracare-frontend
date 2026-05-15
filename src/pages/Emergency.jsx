import { useNavigate } from "react-router-dom";

export default function Emergency({ setTarget }) {
  const navigate = useNavigate();

  // 🌍 Distance
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

  // 🚑 Generate dynamic ambulances
  function generateAmbulances(user) {
    return [
      { id: 1, lat: user.lat + 0.01, lng: user.lng + 0.01, type: "ambulance" },
      {
        id: 2,
        lat: user.lat - 0.008,
        lng: user.lng + 0.005,
        type: "ambulance",
      },
      {
        id: 3,
        lat: user.lat + 0.005,
        lng: user.lng - 0.009,
        type: "ambulance",
      },
    ];
  }

  const handleRequest = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const user = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        console.log("USER:", user);

        // 🚑 Dynamic ambulances
        const ambulances = generateAmbulances(user);

        console.log("AMBULANCES:", ambulances);

        // 🚑 Find nearest ambulance
        let nearestAmb = null;
        let minA = Infinity;

        ambulances.forEach((a) => {
          const dist = getDistance(user.lat, user.lng, a.lat, a.lng);

          if (dist < minA) {
            minA = dist;
            nearestAmb = a;
          }
        });

        console.log("NEAREST AMB:", nearestAmb);

        // 🏥 Fetch hospitals
        const query = `
          [out:json];
          node["amenity"="hospital"](around:3000,${user.lat},${user.lng});
          out;
        `;

        fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: query,
        })
          .then((res) => res.json())
          .then((data) => {
            let nearestHosp = null;
            let minH = Infinity;

            data.elements.forEach((h) => {
              if (!h.lat || !h.lon) return;

              const dist = getDistance(user.lat, user.lng, h.lat, h.lon);

              if (dist < minH) {
                minH = dist;
                nearestHosp = h;
              }
            });

            console.log("HOSPITAL:", nearestHosp);

            const finalData = {
              ambulance: nearestAmb,
              user,
              hospital: {
                lat: nearestHosp.lat,
                lng: nearestHosp.lon,
              },
            };

            setTarget(finalData);

            localStorage.setItem("trackingData", JSON.stringify(finalData));

            navigate("/tracking");
          });
      },
      () => alert("Location denied"),
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className="card">
      <h2>🚑 Emergency</h2>

      <button onClick={handleRequest}>🚨 Request Ambulance</button>
    </div>
  );
}
