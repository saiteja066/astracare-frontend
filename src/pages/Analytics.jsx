import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Analytics({ vehicles = [] }) {
  // ✅ safe fallback
  const count = vehicles.length || 0;

  const data = [
    { time: "T1", traffic: 3 },
    { time: "T2", traffic: 6 },
    { time: "T3", traffic: count },
    { time: "T4", traffic: 5 },
  ];

  return (
    <div className="card">
      <h2>📊 Traffic Analytics</h2>

      {/* IMPORTANT: height must be fixed */}
      <div style={{ width: "100%", height: "300px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="time" stroke="#cbd5f5" />
            <YAxis stroke="#cbd5f5" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="traffic"
              stroke="#38bdf8"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
