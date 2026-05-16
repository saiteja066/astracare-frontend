import MapView from "../MapView";

export default function MapPage({ signals, target }) {
  return (
    <div>
      <h2>🗺️ Map</h2>
      <MapView signals={signals} target={target} />
    </div>
  );
}
