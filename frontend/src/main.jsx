import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Quiz from "./Quiz";
import App from "./App";
import Shared from "./Shared";
import Home from "./Home";
import "./index.css";
import Login from "./Login";
import Register from "./Register";
import ProtectedRoute from "./ProtectedRoute";
ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />   
      <Route path="/app" element={<App />}/>
      <Route path="/shared/:data" element={<Shared />} />
      <Route path="/quiz" element={<Quiz token={localStorage.getItem("token")} />} />
      <Route path="/app" element={ <ProtectedRoute> <App /> </ProtectedRoute> } />
    </Routes>
  </BrowserRouter>
);

