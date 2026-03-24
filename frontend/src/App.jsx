import { useState } from "react";
import Dashboard from "./Dashboard";
import Login from "./Login";
import Register from "./Register";

function App() {

  const [page, setPage] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setPage("login");
  };

  if (!token) {
    if (page === "login") {
      return <Login setToken={setToken} setPage={setPage} />;
    }
    return <Register setPage={setPage} />;
  }

  return <Dashboard token={token} logout={logout} />;
}

export default App;