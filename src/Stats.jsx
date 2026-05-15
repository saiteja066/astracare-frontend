import { FaCar, FaTrafficLight, FaAmbulance } from "react-icons/fa";

export default function Stats({ vehicles, signals }) {
  return (
    <div className="stats">
      <div className="card">
        <FaCar size={22} />
        <div>
          <p>Vehicles</p>
          <h2>{vehicles.length}</h2>
        </div>
      </div>

      <div className="card">
        <FaTrafficLight size={22} />
        <div>
          <p>Signals</p>
          <h2>{signals.length}</h2>
        </div>
      </div>

      <div className="card">
        <FaAmbulance size={22} />
        <div>
          <p>Emergency</p>
          <h2>Active 🚑</h2>
        </div>
      </div>
    </div>
  );
}
