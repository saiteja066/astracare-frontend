import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const login = async () => {
    const res = await axios.post(
      "https://astracare-backend.onrender.com/login",
      {
        email,
        password,
      },
    );

    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      window.location.href = "/";
    } else {
      alert(res.data);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <img
          src="./logo2.png"
          style={{ width: "200px", height: "150px", marginBottom: "10px" }}
        />
        <h1 className="auth-logo">AstraCare</h1>

        <input
          type="email"
          placeholder="Email"
          className="auth-input"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="auth-input"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={login} className="auth-btn">
          Log in
        </button>

        <div className="auth-divider">OR</div>

        <p className="auth-link" onClick={() => navigate("/register")}>
          Create new account
        </p>
      </div>
    </div>
  );
}
