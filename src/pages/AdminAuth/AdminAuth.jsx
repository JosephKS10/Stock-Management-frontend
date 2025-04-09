import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { authenticateAdmin } from "../../utils/api";
import "./AdminAuth.css";

function AdminAuth() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth >= 768);
  const navigate = useNavigate();
  const { authToken, login, sessionExpired, setSessionExpired } = useAdminAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (authToken) {
      navigate("/admin-dashboard");
    }
  }, [authToken, navigate]);

  useEffect(() => {
    if (sessionExpired) {
      const timer = setTimeout(() => setSessionExpired(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [sessionExpired, setSessionExpired]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Both fields are required");
      return;
    }

    setError("");

    try {
      const data = await authenticateAdmin(username, password);
      login(data.token);
    } catch (error) {
      setError(error.message);
    }
  };

  if (!isMobile) {
    return (
      <div className="warning-screen">
        <h1 style={{ fontSize: "2.5rem" }}>
          This page is only accessible on <span className="indigo-blue">Desktop devices</span>
        </h1>
      </div>
    );
  }

  return (
    <div className="admin-auth-container">
      {/* Grey Navbar with Logo */}
      <nav className="admin-navbar">
        <div className="admin-logo">
          <img src="/logo.png" alt="Wally Cleaning Company" />
        </div>
      </nav>

      {/* Main Content */}
      <div className="admin-auth-content">
        {/* Left Side with Background Image */}
        <div className="auth-left-side">
          <div className="auth-overlay">
            <h1>
              Welcome to <br /><span>Wally Cleaning Company</span>
              <br />
              Stock Ordering Portal
            </h1>
          </div>
        </div>

        {/* Right Side with Login Form */}
        <div className="auth-right-side">
          <div className="auth-form-container">
            <h2>Admin <span className="indigo-blue">Sign In</span></h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Admin Username</label>
                <input
                  type="text"
                  id="username"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <button type="submit" className="auth-submit-btn">
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Session Expired Popup */}
      {sessionExpired && (
        <div className="session-expired-popup">
          <div className="popup-content">
            <h2>Session Expired</h2>
            <p>Your admin session has expired. Please log in again.</p>
            <button onClick={() => setSessionExpired(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAuth;