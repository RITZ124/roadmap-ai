import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const register = async () => {

    // ✅ FRONTEND VALIDATION
    if (!username || !email || !phone || !password) {
      alert("All fields are required");
      return;
    }

    if (!email.includes("@")) {
      alert("Invalid email");
      return;
    }

    if (phone.length !== 10) {
      alert("Phone must be 10 digits");
      return;
    }

    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          phone,
          password
        })
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
      } else {
        alert("Registered Successfully 🚀");
        navigate("/login");
      }

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-lg w-96">

        <h2 className="text-2xl mb-4 text-center">Create Account</h2>

        {/* USERNAME */}
        <input
          value={username}   // ✅ FIXED
          className="w-full p-2 mb-3 bg-transparent border border-gray-500 rounded"
          placeholder="Username"
          onChange={e => setUsername(e.target.value)}
        />

        {/* EMAIL */}
        <input
          value={email}   // ✅ FIXED
          className="w-full p-2 mb-3 bg-transparent border border-gray-500 rounded"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />

        {/* PHONE */}
        <input
          value={phone}   // ✅ FIXED
          className="w-full p-2 mb-3 bg-transparent border border-gray-500 rounded"
          placeholder="Phone"
          onChange={e => setPhone(e.target.value)}
        />

        {/* PASSWORD */}
        <input
          value={password}   // ✅ FIXED
          type="password"
          className="w-full p-2 mb-4 bg-transparent border border-gray-500 rounded"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />

        <button
          onClick={register}
          className="w-full bg-blue-600 py-2 rounded hover:bg-blue-500"
        >
          Register
        </button>

        <p
          className="text-center mt-4 cursor-pointer text-gray-400"
          onClick={() => navigate("/login")}
        >
          Already have an account? Login
        </p>

        <p
          className="text-center mt-2 cursor-pointer text-gray-500"
          onClick={() => navigate("/")}
        >
          ⬅ Back to Home
        </p>

      </div>

    </div>
  );
}

export default Register;