import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

function Login() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {

    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      navigate("/app");   // ✅ Redirect to dashboard
    } else {
      alert("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-lg w-80">

        <h2 className="text-2xl mb-4 text-center">Login</h2>

        <input
          className="w-full p-2 mb-3 bg-transparent border border-gray-500 rounded"
          placeholder="Username / Email / Phone"
          onChange={e => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-2 mb-4 bg-transparent border border-gray-500 rounded"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full bg-blue-600 py-2 rounded hover:bg-blue-500"
        >
          Login
        </button>

        <p
          className="text-center mt-4 cursor-pointer text-gray-400"
          onClick={() => navigate("/register")}   // ✅ FIXED
        >
          Create Account
        </p>

        <p
          className="text-center mt-2 cursor-pointer text-gray-500"
          onClick={() => navigate("/")}   // ✅ Back to Home
        >
          ⬅ Back
        </p>

      </div>

    </div>
  );
}

export default Login;