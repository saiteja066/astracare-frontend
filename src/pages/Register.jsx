import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const register = async () => {
    if (!email || !password) {
      alert("Please enter all fields");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/register", {
        email,
        password,
      });

      alert(res.data);

      // 🔥 go to login
      navigate("/login");
    } catch (err) {
      alert(err.response?.data || "Register failed");
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

        <button onClick={register} className="auth-btn">
          Sign up
        </button>

        <div className="auth-divider">OR</div>

        <p>
          Already have an account?{" "}
          <span className="auth-link" onClick={() => navigate("/login")}>
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}
