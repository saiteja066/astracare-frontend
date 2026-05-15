import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Charts() {
  const data = [
    { name: "T0", value: 5 },
    { name: "T1", value: 7 },
    { name: "T2", value: 6 },
  ];

  return (
    <div className="card">
      <h3>Traffic Flow</h3>

      {/* 🔥 HARD FIX HEIGHT */}
      <div style={{ width: "100%", height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#60a5fa" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
