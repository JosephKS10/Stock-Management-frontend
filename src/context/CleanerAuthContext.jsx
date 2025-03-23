import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const CleanerAuthProvider = ({ children }) => {
  const storedToken = localStorage.getItem("auth_token");
  const storedLoginTime = localStorage.getItem("login_time");
  const storedSiteId = localStorage.getItem("site_id"); // Retrieve site_id

  const [authToken, setAuthToken] = useState(storedToken || null);
  const [loginTime, setLoginTime] = useState(storedLoginTime ? parseInt(storedLoginTime) : null);
  const [siteId, setSiteId] = useState(storedSiteId || null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const login = (token, site_id) => {
    const currentTime = Date.now(); // Current time in milliseconds
    setAuthToken(token);
    setLoginTime(currentTime);
    setSiteId(site_id); // Store site_id

    localStorage.setItem("auth_token", token);
    localStorage.setItem("login_time", currentTime);
    localStorage.setItem("site_id", site_id); // Save site_id
  };

  const logout = () => {
    setAuthToken(null);
    setLoginTime(null);
    setSiteId(null);
    
    localStorage.removeItem("auth_token");
    localStorage.removeItem("login_time");
    localStorage.removeItem("site_id"); // Remove site_id
  };

  useEffect(() => {
    if (!authToken || !loginTime) return;

    const checkExpiration = () => {
      const currentTime = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

      if (currentTime - loginTime >= oneHour) {
        setSessionExpired(true);
        logout();
      }
    };

    const interval = setInterval(checkExpiration, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [authToken, loginTime]);

  return (
    <AuthContext.Provider value={{ authToken, siteId, login, logout, sessionExpired, setSessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
};
