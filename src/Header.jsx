export default function Header() {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 text-sm">Real-time monitoring</p>
      </div>

      <div className="bg-white/10 px-4 py-2 rounded-lg">🚑 Emergency Mode</div>
    </div>
  );
}
