import MapView from "../MapView";

export default function MapPage({ signals = [], target = {} }) {
  return (
    <div>
      <h2>🗺️ Map</h2>

      <div style={{ height: "500px" }}>
        <MapView
          signals={Array.isArray(signals) ? signals : []}
          target={target || {}}
        />
      </div>
    </div>
  );
}
