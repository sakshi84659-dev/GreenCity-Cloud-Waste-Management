
import React, { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      if (!data.token || !data.user) {
        throw new Error("Invalid login response from backend.");
      }

      if (data.user.role !== "Admin") {
        throw new Error("Admin access required.");
      }

      sessionStorage.setItem("greencity_token", data.token);
      sessionStorage.setItem(
        "greencity_user",
        JSON.stringify(data.user)
      );

      onLogin(data.user);

    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to backend. Start your backend server."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
      fontFamily: "Arial, sans-serif",
      padding: "20px"
    }}>
      <form onSubmit={handleLogin} style={{
        width: "100%",
        maxWidth: "380px",
        padding: "35px",
        background: "white",
        borderRadius: "18px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)"
      }}>
        <h1 style={{
          color: "#16834a",
          textAlign: "center"
        }}>
          GreenCity 🌱
        </h1>

        <p style={{
          textAlign: "center",
          color: "#666"
        }}>
          Welcome Back! Login to your account
        </p>

        <label>Email Address</label>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <label>Password</label>

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            background: "#16834a",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            marginTop: "15px"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && (
          <p style={{
            textAlign: "center",
            color: "#d32f2f",
            marginTop: "15px"
          }}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  margin: "10px 0 20px",
  boxSizing: "border-box",
  border: "1px solid #ddd",
  borderRadius: "7px"
};

export default Login;
