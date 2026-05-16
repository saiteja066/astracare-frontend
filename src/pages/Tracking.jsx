useEffect(() => {
  if (!data || !data.user || !data.ambulance) return;

  const fetchRoute = async () => {
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${data.ambulance.lng},${data.ambulance.lat};${data.user.lng},${data.user.lat}?overview=full&geometries=geojson`,
      );

      const result = await res.json();

      console.log("Route API:", result);

      if (result?.routes?.length > 0) {
        const coords = result.routes[0].geometry.coordinates.map((c) => [
          c[1],
          c[0],
        ]);

        setRoute(coords);
      }
    } catch (err) {
      console.log(err);
    }
  };

  fetchRoute();
}, [data]);
