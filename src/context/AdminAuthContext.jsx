import { createContext, useState, useContext, useEffect } from "react";

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const storedToken = localStorage.getItem("adminAuthToken");
  const storedLoginTime = localStorage.getItem("adminLoginTime");
  const [authToken, setAuthToken] = useState(storedToken || null);
  const [loginTime, setLoginTime] = useState(storedLoginTime ? parseInt(storedLoginTime) : null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const login = (token) => {
    const currentTime = Date.now();
    setAuthToken(token);
    setLoginTime(currentTime);
    localStorage.setItem("adminAuthToken", token);
    localStorage.setItem("adminLoginTime", currentTime);
  };

  const logout = () => {
    setAuthToken(null);
    setLoginTime(null);
    localStorage.removeItem("adminAuthToken");
    localStorage.removeItem("adminLoginTime");
    window.location.href = "/admin-auth"; // Direct navigation
  };

  // Check token expiration every 5 seconds
  useEffect(() => {
    if (!authToken || !loginTime) return;

    const checkExpiration = () => {
      const currentTime = Date.now();
      const sixHours = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

      if (currentTime - loginTime >= sixHours) {
        setSessionExpired(true);
        logout();
      }
    };

    const interval = setInterval(checkExpiration, 5000);
    return () => clearInterval(interval);
  }, [authToken, loginTime]);

  return (
    <AdminAuthContext.Provider value={{ 
      authToken, 
      loginTime, 
      login, 
      logout, 
      sessionExpired, 
      setSessionExpired 
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};