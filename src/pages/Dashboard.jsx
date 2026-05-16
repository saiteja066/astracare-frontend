import { useEffect, useState } from "react";

export default function Dashboard({ vehicles = [], signals = [] }) {
  const [vCount, setVCount] = useState(0);
  const [sCount, setSCount] = useState(0);

  useEffect(() => {
    let v = 0;
    let s = 0;

    const interval = setInterval(() => {
      if (v < vehicles.length) v++;
      if (s < signals.length) s++;

      setVCount(v);
      setSCount(s);

      if (v === vehicles.length && s === signals.length) {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [vehicles, signals]);

  return (
    <div>
      <div className="title">🚦 Smart Traffic Dashboard</div>

      <div className="grid">
        <div className="card">
          <h3>Vehicles</h3>
          <h1>{vehicles.length === 0 ? "—" : vCount}</h1>
        </div>

        <div className="card">
          <h3>Signals</h3>
          <h1>{signals.length === 0 ? "—" : sCount}</h1>
        </div>

        <div className="card">
          <h3>Emergency</h3>
          <h1 className="pulse">Active 🚑</h1>
        </div>
      </div>
    </div>
  );
}
