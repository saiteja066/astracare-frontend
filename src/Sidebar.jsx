import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/", icon: "🏠" },
    { name: "Map", path: "/map", icon: "🗺️" },
    { name: "Hospitals", path: "/hospitals", icon: "🏥" },
    { name: "Emergency", path: "/emergency", icon: "🚑" },
  ];

  return (
    <div style={styles.sidebar}>
      <h2>🚦 Traffic</h2>

      {menu.map((item, i) => (
        <Link
          key={i}
          to={item.path}
          style={{
            ...styles.link,
            ...(location.pathname === item.path ? styles.active : {}),
          }}
        >
          {item.icon} {item.name}
        </Link>
      ))}
    </div>
  );
}

const styles = {
  sidebar: {
    width: "220px",
    background: "#0b132b",
    color: "white",
    padding: "20px",
    height: "100vh",
  },
  link: {
    display: "block",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "10px",
    color: "#cbd5e1",
    textDecoration: "none",
  },
  active: {
    background: "#1e293b",
    color: "white",
  },
};
