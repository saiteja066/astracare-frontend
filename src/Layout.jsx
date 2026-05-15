export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 p-6 bg-white/5 backdrop-blur-xl border-r border-white/10">
        <h2 className="text-2xl font-bold mb-10">🚦 Traffic</h2>

        <nav className="space-y-4 text-gray-300">
          <p className="hover:text-white cursor-pointer">Dashboard</p>
          <p className="hover:text-white cursor-pointer">Admin</p>
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 p-6 md:p-10">{children}</div>
    </div>
  );
}
