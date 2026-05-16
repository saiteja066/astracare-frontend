import MapView from "../MapView";

export default function MapPage({ signals = [], target = {} }) {
  return (
    <div className="card">
      <h2>🗺️ Live Traffic Map</h2>

      <div
        style={{ height: "500px", borderRadius: "12px", overflow: "hidden" }}
      >
        <MapView signals={signals} target={target} />
      </div>
    </div>
  );
}
