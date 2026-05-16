import { useEffect, useState } from "react";

export default function Dashboard({ vehicles = [], signals = [] }) {
  const [vCount, setVCount] = useState(0);
  const [sCount, setSCount] = useState(0);

  /* 🔢 ANIMATION COUNTER */
  useEffect(() => {
    let v = 0;
    let s = 0;

    const vLen = Array.isArray(vehicles) ? vehicles.length : 0;
    const sLen = Array.isArray(signals) ? signals.length : 0;

    const interval = setInterval(() => {
      if (v < vLen) v++;
      if (s < sLen) s++;

      setVCount(v);
      setSCount(s);

      if (v === vLen && s === sLen) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [vehicles, signals]);

  return (
    <div>
      <div className="title">🚦 Smart Traffic Dashboard</div>

      <div className="grid">
        <div className="card">
          <h3>Vehicles</h3>
          <h1>{vCount}</h1>
        </div>

        <div className="card">
          <h3>Signals</h3>
          <h1>{sCount}</h1>
        </div>

        <div className="card">
          <h3>Emergency</h3>
          <h1 className="pulse">Active 🚑</h1>
        </div>
      </div>
    </div>
  );
}
