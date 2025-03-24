import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/CleanerAuthContext";
import { useNavigate } from "react-router-dom";
import { authenticateSite } from "../../utils/api";
import "./SiteAuth.css";

function SiteAuth() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentTime, setCurrentTime] = useState(getFormattedTime());
  const [siteName, setSiteName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getFormattedTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check if the auth token is stored and still valid
    const storedToken = localStorage.getItem("auth_token");
    const storedLoginTime = localStorage.getItem("login_time");

    if (storedToken && storedLoginTime) {
      const loginTime = parseInt(storedLoginTime);
      const currentTime = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

      if (currentTime - loginTime < oneHour) {
        // Token is still valid, redirect to Cleaner Order page
        navigate("/cleaner-order");
      } else {
        // Token has expired, remove it
        localStorage.removeItem("auth_token");
        localStorage.removeItem("login_time");
      }
    }
  }, [navigate]);

  function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString("en-GB", { hour12: false });
  }

  if (!isMobile) {
    return (
      <div className="warning-screen">
        <h1>This page is only accessible on <span className="indigo-blue">mobile devices</span>.</h1>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!siteName || !password) {
      setError("Both fields are required");
      return;
    }

    setError("");

    try {
      const data = await authenticateSite(siteName, password);
      localStorage.setItem("login_time", Date.now());
      login(data.auth_token, data.site_id);
      navigate("/cleaner-order");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="site-auth-container">
      <div className="time-display">{currentTime}</div>

      <h1>
        Welcome to <span className="indigo-blue" style={{ fontWeight: "600" }}>
          <br /> Wally Cleaning <br /> Company <br />
        </span>
        <span style={{ color: "#101317", fontWeight: "600" }}>stock ordering portal</span>
      </h1>
      <p>Hello there, Put Site ID to continue</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Site Name</label>
        <input
          type="text"
          placeholder="Enter site name"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error-message">{error}</p>}

        <button type="submit">Log In</button>
      </form>
    </div>
  );
}

export default SiteAuth;
