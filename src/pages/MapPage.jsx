import MapView from "../MapView";

export default function MapPage({ vehicles, signals, target }) {
  return (
    <div className="card">
      <h2>🗺️ Live Map</h2>

      <div
        style={{ height: "500px", borderRadius: "12px", overflow: "hidden" }}
      >
        <MapView vehicles={vehicles} signals={signals} target={target} />
      </div>
    </div>
  );
}
